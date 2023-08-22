const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', '© BOT-POLITEIA - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-POLITEIA QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BOT-POLITEIA Dispositivo pronto!');
    socket.emit('message', '© BOT-POLITEIA Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BOT-POLITEIA Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-POLITEIA Autenticado!');
    socket.emit('message', '© BOT-POLITEIA Autenticado!');
    console.log('© BOT-POLITEIA Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-POLITEIA Falha na autenticação, reiniciando...');
    console.error('© BOT-POLITEIA Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-POLITEIA Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-POLITEIA Cliente desconectado!');
  console.log('© BOT-POLITEIA Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/politeia-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/politeia-media', [
  body('number').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;
  let groupChat = await msg.getChat();
  
  if (groupChat.isGroup) return null;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == "") return null;
	
  if (msg.from.includes("@g.us")) return null;

  if (msg.body !== null && msg.body === "1") {
    msg.reply("O uso de inteligência artificial no WhatsApp é hoje a maior ferramenta de divulgação e atendimento de serviços e produtos da internet 📲\nSe você busca aumentar seu cadastro de contatos, conquistar novos mercados ou manter seus clientes sempre atualizados com as novidade de seu negócio, a robotização do WhatsApp é para você! 💰");
  } 
  
  else if (msg.body !== null && msg.body === "2") {
    msg.reply("*" + nomeContato + "*, você não precisa de equipamentos especiais para contratar os serviços de inteligência artificial para WhatsApp da Politeia, apenas vontade de crescer, atender rapidamente seus clientes e ganhar ainda mais dinheiro! 🚀");
  }
  
  else if (msg.body !== null && msg.body === "3") {
    msg.reply("*" + nomeContato + "*, " + "não é necssário instalar nenhum programa ou configurar aplicativos e contas, nós fazemos tudo isso por você! 😇");
  }
     
    else if (msg.body !== null && msg.body === "4"){
       msg.reply("Atualmente os serviços da Politeia podem ser instalados em qualquer cidade do 🇧🇷");
    }
  
  else if (msg.body !== null && msg.body === "5") {
    msg.reply("*" + nomeContato + "*" + ", nosso sistema de atendimento robotizado interage totalmente com seus clientes, envia respostas, faz perguntas, disponibiliza arquivos de áudio, vídeo e documentos, direciona chamadas e muito mais! 👩🏻‍💻");
  }
	  
  else if (msg.body !== null && msg.body === "6") {
    msg.reply("*" + nomeContato + "*, " + "você não precisa estar conecatdo a internet, nem estar com seu celular ligado!\nTodo o sistema de atendimento robotizado da Politeia funciona independente do cliente 😉");
  }
	  
  else if (msg.body !== null && msg.body === "7") {
    msg.reply("Não é preciso ter um número de 📱 exclusivo para instalação do atendimento robotizado, a menos que você queira.\nO sistema pode funcionar em um número que você já utilize para atendimento, ou em algum número fornecido pela Politeia. A escolha é sua!");
  }

  else if (msg.body !== null && msg.body === "8") {
   const contact = await msg.getContact();
   const indice = MessageMedia.fromFilePath('./AutomacaodeConversas.pdf');
	  client.sendMessage(msg.from, indice, {caption: 'Baixe nosso catálogo sobre atendimento robotizado, aqui você encontra detalhes sobre o que a inteligência artificial pode fazer por suas redes sociais 🤖'});  
        setTimeout(function() {
            client.sendMessage('5511949146253@c.us','Cliente *' + nomeContato + '*, baixou catálogo. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5511949146253@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));     
    
  }
  
  else if (msg.body !== null && msg.body === "9") {
	  msg.reply("Nosso horário de funcionamento é das *9h às 19h*\nCaso nenhum atendente te responda dentro deste horário, tente novamente por favor!\nSegue contato de quem ficará responsável por lhe dar as informações necessárias:");
  
  } 
  
  else if (msg.body !== null && msg.body === "10") {
   
  }
  
  else if (msg.body !== null && msg.body === "11") {
    msg.reply("");
   }
  
  else if (msg.body !== null && msg.body === "12") {
    msg.reply("");
  }
  
 else if (msg.body !== null && msg.body === "13") {
  }
  
 else if (msg.body !== null && msg.body === "14") {
    msg.reply("");
  }

  else if (msg.body !== null && msg.body === "15") {
    msg.reply("");
  }
	  
else if (msg.body !== null && msg.body === "16"){
  }
    
  else if (msg.body !== null && msg.body === "17") {

        //const contact = await msg.getContact();
        //setTimeout(function() {
            //msg.reply('*' + nomeContato + '*, ' + ', seu contato já foi encaminhado para a Politeia');  
            //client.sendMessage('5511949146253@c.us','Contato Politeia. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5511949146253@c.us',`${contact.number}`);
          //},1000 + Math.floor(Math.random() * 1000));
  
  }
  
  //else if (msg.body !== null && msg.body === "17") {
  //msg.reply("Seu contato já foi encaminhado para a Politeia");
  //} 
  
  else if (msg.body !== null && msg.body === "18") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "19") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "20") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "21") {
    msg.reply("");
  }
  
  else if (msg.body !== null && msg.body === "22") {
    msg.reply("");
  }

  else if (msg.body !== null && msg.body === "23") {
    msg.reply("");
  }

  else if (msg.body !== null && msg.body === "24") {
    msg.reply("");
	  
  }

  else if (msg.body !== null || msg.body === "0" || msg.type === 'ptt' || msg.hasMedia) {
    msg.reply("Olá *" + nomeContato + "* 🤗, nossa secretária virtual tem um recado para você!");
      delay(2000).then(async function() {
      try{
        const media = MessageMedia.fromFilePath('./saudacao.ogg');
        client.sendMessage(msg.from, media, {sendAudioAsVoice: true})
        //msg.reply(media, {sendAudioAsVoice: true});
      } catch(e){
        console.log('audio off')
      }
		});
    delay(12000).then(async function() {
      const saudacao = ("Este é um atendimento automático. Caso queira resolver sua dúvida por aqui agora mesmo, digite o número de uma das opções abaixo para iniciarmos nossa conversa: ⬇️\r\n\r\n*1* - Quero saber como funciona esse robô de WhatsApp \r\n*2* - Quais equipamentos preciso ter para iniciar este serviço? \r\n*3* - Terei que instalar ou configurar alguma coisa? \r\n*4* - Funciona no Brasil todo?\r\n*5* - Este robô responde as mensagens enviadas pelos clientes?\r\n*6* - Preciso estar com meu celular conectado na internet para que o sistema funcione? \r\n*7* - Preciso ter um número exclusivo para ativar o atendimento robotizado? \r\n*8* - Quanto custa este serviço?  \r\n*9* - Minha dúvida não está aqui, quero falar com alguém da Politeia");
	     client.sendMessage(msg.from, saudacao)
     		});
    
	}
});

console.log("\nA Politeia desenvolve este e outros sistemas que usam inteligência artificial para facilitar sua interatividade com clientes e fornecedores de maneira simples e eficiente.")
console.log("\nQuer um atendimento como este? Mande uma mensagem agora mesmo para nossa equipe clicando no múmero a seguir: *11949146253*")
    
server.listen(port, function() {
        console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
