importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyCv3l7nY7fqzAead9ue8Wm6Mc50WhDglgo",
  authDomain: "pawin-6b84a.firebaseapp.com",
  projectId: "pawin-6b84a",
  storageBucket: "pawin-6b84a.firebasestorage.app",
  messagingSenderId: "927720563589",
  appId: "1:927720563589:web:bafc3a4c1bc0ffd3a19aec",
  measurementId: "G-567W0W3YVG"
};


firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
