const socket = io();
const $messages = document.querySelector('#messages')
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const sendButton = document.getElementById("sendMessage");

const sendLocationButton = document.getElementById("sendLocation");

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
  const $newMessage =$messages.lastElementChild
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  const visibleHeight =  $messages.offsetHeight
  const containerheight = $messages.scrollHeight
  const scrollOffset = $messages.scrollTop + visibleHeight

  if(containerheight - newMessageHeight <= scrollOffset)
  {
    $messages.scrollTop = $messages.scrollHeight
  }

  console.log(newMessageStyles)
}

// socket.on('countUpdated', (count) => {
//     console.log('the count has been updated', count)
// })

// document.getElementById('increment').addEventListener('click', () => {
//     socket.emit('increment')
// })

socket.on("welcomeMessage", (welcomeMessage) => {
  console.log(welcomeMessage);
  const html = Mustache.render(messageTemplate, {
    message: welcomeMessage.text,
    createdAt: moment(welcomeMessage.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
});

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
});

socket.on("locationMessage", (locationMessage) => {
  console.log(locationMessage);
  const html = Mustache.render(locationMessageTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
});

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

sendButton.addEventListener("click", () => {
  const messageInput = document.getElementById("message");
  const message = messageInput.value.trim();

  if (!message) return; // prevent empty messages

  // Disable button to prevent multiple clicks
  sendButton.disabled = true;

  socket.emit("message", message, (error) => {
    // Re-enable after acknowledgment
    sendButton.disabled = false;

    if (error) {
      return console.error(error);
    }
    console.log("The message was delivered!");
    messageInput.value = ""; // clear input after sending
  });
});

sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  // Disable button to prevent multiple clicks
  sendLocationButton.disabled = true;

  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    socket.emit(
      "sendLocation",
      { latitude, longitude },
      (error) => {
        // Re-enable button after acknowledgment
        sendLocationButton.disabled = false;

        if (error) {
          return console.error(error);
        }
        console.log("Location sent successfully!");
      }
    );
  });
});

socket.emit('join', {username, room}, (error) => {
  if(error)
  {
    alert(error)
    location.href = '/'
  }
})
