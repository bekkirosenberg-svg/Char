let socket;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const connectBtn = document.getElementById('connect-btn');
const statusIndicator = document.getElementById('status');
const chatForm = document.getElementById('chat-form');
const textInput = document.getElementById('text-input');
const imageInput = document.getElementById('image-input');
const micBtn = document.getElementById('mic-btn');
const container = document.getElementById('message-container');

// Connect to Socket.IO backend
connectBtn.addEventListener('click', () => {
  if (!socket || !socket.connected) {
    socket = io();

    socket.on('connect', () => {
      statusIndicator.classList.add('connected');
      connectBtn.innerText = 'Disconnect';
    });

    socket.on('disconnect', () => {
      statusIndicator.classList.remove('connected');
      connectBtn.innerText = 'Connect';
    });

    socket.on('chatMessage', (data) => {
      renderMessage(data);
    });
  } else {
    socket.disconnect();
  }
});

// Send Text Message
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = textInput.value.trim();
  if (text && socket && socket.connected) {
    socket.emit('chatMessage', { text });
    textInput.value = '';
  }
});

// Send Image File
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && socket && socket.connected) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('chatMessage', { image: reader.result });
    };
    reader.readAsDataURL(file);
  }
});

// Handle Voice Recording
micBtn.addEventListener('click', async () => {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          if (socket && socket.connected) {
            socket.emit('chatMessage', { audio: reader.result });
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;
      micBtn.classList.add('recording');
    } catch (err) {
      alert('Microphone access denied or unavailable.');
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
  }
});

// Dynamic Message Renderer
function renderMessage(data) {
  const bubble = document.createElement('div');
  const isSelf = socket && data.sender === socket.id;
  bubble.classList.add('message-bubble');
  if (isSelf) bubble.classList.add('user');

  if (data.text) {
    const p = document.createElement('p');
    p.innerText = data.text;
    bubble.appendChild(p);
  }

  if (data.image) {
    const img = document.createElement('img');
    img.src = data.image;
    bubble.appendChild(img);
  }

  if (data.audio) {
    const audio = document.createElement('audio');
    audio.src = data.audio;
    audio.controls = true;
    bubble.appendChild(audio);
  }

  const timeStr = document.createElement('span');
  timeStr.classList.add('timestamp');
  timeStr.innerText = data.timestamp;
  bubble.appendChild(timeStr);

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

