import vision from '@google-cloud/vision';
import chokidar from 'chokidar';
import fs from 'fs';
import _ from 'lodash';
import notifier from 'node-notifier';
import OpenAI from 'openai';
import credentials from './key.json' assert { type: 'json' };


const client = new vision.ImageAnnotatorClient({credentials});

 // Leer datos desde el archivo
 const data = fs.readFileSync('datos.json', 'utf-8');
 const datos = JSON.parse(data);

 const openai = new OpenAI({
   apiKey: datos.llave,
 });

const directorioMonitorizado = '/home/abel/Imágenes/Capturas de pantalla'; // Cambia esto por la ruta a tu escritorio


// Conjunto para almacenar las rutas de las imágenes ya procesadas
const imagenesProcesadas = new Set();




// Configura el observador de cambios en el directorio
const watcher = chokidar.watch(directorioMonitorizado, {
  ignored: /^\./, // Ignora los archivos que comienzan con un punto
  persistent: true,
});

console.log(`Observando cambios en ${directorioMonitorizado}`);

// Maneja los eventos de cambio
watcher.on('add', async (ruta) => {
  // Verifica si la imagen ya ha sido procesada
  if (imagenesProcesadas.has(ruta)) {
    return;
  }


  console.log(`Archivo detectado: ${ruta}`);
  
  // Puedes agregar lógica adicional aquí para verificar si el archivo es una captura de pantalla u otro tipo de imagen
  
  // Lee el contenido del archivo
  fs.readFile(ruta, async (err, data) => {
    if (err) {
      console.error(`Error al leer el archivo: ${err}`);
      return;
    }
    var img = await client.textDetection(data);
    var textoDeImagen = img[0].textAnnotations[0].description;
    //console.log(textoDeImagen);


// Lista de palabras a eliminar
let palabrasAEliminar = [
  "[→Guardar y Pausar",
  "→Guardar y Pausar",
  "→Salir",
  "[→Salir",
  "Guardar y Continuar",
  "Actividades Aplicaciones Lugares",
  "H x Nueva pestaña",
  "• EXAMEN DE CURSO PREFACULTATIVO CPF - 2023 CARRERA DE DERECHO",
  "FACULTAD DE DEREC",
  "• EXAMEN DE CURSO PREFACULTATIVO CPF-2023 CARRERA DE DERECHO",
  "← →",
  "• Hora de la Prueba: ",
  "О О О С",
  "Nueva pestaña",
  "Google Chrome",
  "(",
  "→",
  "derecho.examenesbolivia.com/#/test/home",
  "U.M.S.A.",
  "●",
  "Postulante:",
  "ABEL MAURO ESCOBAR LARICO",
  "16950877"

];
// Escapar los caracteres especiales en las palabras
let palabrasEscapadas = palabrasAEliminar.map(_.escapeRegExp);

// Crear la expresión regular utilizando la función replace()
let patron = new RegExp(palabrasEscapadas.join('|'), 'g');
let textoLimpio = textoDeImagen.replace(patron, '').trim();

console.log(textoLimpio);
consulta(textoLimpio)

  
    
  });
}); 



  async function consulta(pregunta) {
    if (datos.identificacion == 802) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4-1106-preview",
          messages: [
            {"role": "system", "content": `Responderas estas preguntas de 
              este examen de derecho de forma
              rapida, breve y consisa,
              Eligiendo con tu lógica y conocimiento unas de las respuestas
              y si no hay respuestas solo dame la respuesta  correcta. 
              Cada pregunta empieza con el numero de pregunta mas un ")" ejm: "1)",
              en algunos casos los incisos estaran desordenados asi que ignora todo con exepcion a la pregunta los los incisos de repuesta, 
              solo puedes escoger un inciso. 
              Tu misión es pasar este examen con el mayor puntaje posible
              estamos en Bolivia`},
            {"role": "user","content": pregunta},
          ],
          temperature: 0,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
  
        notifier.notify({
          title: 'Morgan',
          message: response.choices[0].message.content
        });
        console.log("respuesta es: " + response.choices[0].message.content);
      } catch (error) {
        console.error("Error en la consulta:", error);
      }
    } else {
      console.log("Modo Prueba Solo se Mostrara el texto Digital");
      notifier.notify({
        title: 'Morgan',
        message: `Modo Prueba: digital ${pregunta}`
      });
    }
  }
