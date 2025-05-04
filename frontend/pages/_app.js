// frontend/pages/_app.js
import '../styles/main.css'; // Import your CSS file here

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;