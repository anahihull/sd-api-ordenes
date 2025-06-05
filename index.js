// api-ordenes/index.js

require('dotenv').config(); // Carga AWS_REGION y SQS_QUEUE_URL desde .env

const express = require('express');
const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand
} = require('@aws-sdk/client-sqs');

const app = express();
app.use(express.json()); // Parsear JSON bodies

const { AWS_REGION, SQS_QUEUE_URL } = process.env;
if (!AWS_REGION || !SQS_QUEUE_URL) {
  console.error('❌ Debes definir AWS_REGION y SQS_QUEUE_URL en el .env');
  process.exit(1);
}

const sqsClient = new SQSClient({ region: AWS_REGION });


let alumnos = [];
let nextAlumnoId = 1;


function crearAlumno({ nombre, fechaNacimiento, idCurso }) {
  const nuevo = {
    id: nextAlumnoId++,
    nombre,
    fechaNacimiento,
    idCurso
  };
  alumnos.push(nuevo);
  return nuevo;
}

app.get("/", (_req, res) => {
  res.send(`API-Funcionando 🟢 (puerto ${PORT})`);
});

async function pollSQS() {
  const receiveParams = {
    QueueUrl: SQS_QUEUE_URL,
    MaxNumberOfMessages: 5,   // hasta 5 mensajes por lote
    WaitTimeSeconds: 10,      // long polling de hasta 10 segundos
    VisibilityTimeout: 30,    // oculta el mensaje 30s mientras se procesa
  };

  try {
    const receiveCommand = new ReceiveMessageCommand(receiveParams);
    const data = await sqsClient.send(receiveCommand);

    if (data.Messages && data.Messages.length > 0) {
      for (const msg of data.Messages) {
        let bodyObj = null;
        try {
          bodyObj = JSON.parse(msg.Body);
        } catch (errParse) {
          console.error('Mensaje con JSON inválido, se ignorará:', msg.Body);
        }

        if (
          bodyObj &&
          bodyObj.action === 'create' &&
          typeof bodyObj.payload === 'object' &&
          bodyObj.payload !== null
        ) {
          const payload = bodyObj.payload;

          if (
            typeof payload.nombre === 'string' &&
            typeof payload.fechaNacimiento === 'number' &&
            typeof payload.idCurso === 'number'
          ) {
            // Usamos la función crearAlumno para agregar al arreglo 'alumnos'
            const nuevoAlumno = crearAlumno({
              nombre: payload.nombre,
              fechaNacimiento: payload.fechaNacimiento,
              idCurso: payload.idCurso
            });
            console.log('Se agregó alumno desde SQS:', nuevoAlumno);
          } else {
            console.warn('Payload incompleto o mal formado, se ignoró:', payload);
          }
        }

        if (msg.ReceiptHandle) {
          const deleteParams = {
            QueueUrl: SQS_QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle,
          };
          const deleteCommand = new DeleteMessageCommand(deleteParams);
          await sqsClient.send(deleteCommand);
        }
      }
    }
  } catch (err) {
    console.error('Error al procesar SQS:', err);
  } finally {
    // Espera 5 segundos antes de volver a hacer polling
    setTimeout(pollSQS, 5000);
  }
}

// Inicia el listener de SQS al arrancar la aplicación
pollSQS().catch((err) => {
  console.error('Error al iniciar pollSQS:', err);
});



app.get('/alumnos', (req, res) => {
  res.json(alumnos);
});


app.get('/alumnos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const alumno = alumnos.find(a => a.id === id);
  if (!alumno) {
    return res.status(404).json({ error: `Alumno con id=${id} no encontrado.` });
  }
  return res.json(alumno);
});


app.delete('/alumnos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = alumnos.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Alumno con id=${id} no encontrado.` });
  }
  const eliminado = alumnos.splice(index, 1)[0];
  return res.json({ deleted: eliminado });
});


app.use((err, _req, res, _next) => {
  console.error('Error inesperado en el servidor:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Segundo API “Alumnos” escuchando en http://localhost:${PORT}`);
});