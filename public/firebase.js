// Firebaseの初期設定 (あなたのプロジェクトに合わせて書き換えてください)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ハイスコアランキング更新・取得の処理はここに書けます
// 例として保存と取得の関数だけサンプルで用意

function saveHighscore(name, score) {
  const ref = database.ref('highscores');
  ref.push({ name, score });
}

function fetchHighscores(callback) {
  const ref = database.ref('highscores').orderByChild('score').limitToLast(10);
  ref.on('value', snapshot => {
    const scores = [];
    snapshot.forEach(child => {
      scores.push(child.val());
    });
    scores.sort((a, b) => b.score - a.score);
    callback(scores);
  });
}
