const keys = [
  'ytOL0aQuB47LjVe9GPX9eGsCWvCJPsHGvdwJcuLY',
  'K4wnbBBwy4a4VuXpWZbbloWTmdz5HrMlpU7TX608',
  'Ch83szgfRoMbUDK1sG3iaF31C5rFCwbSM5pKaZnW'
];

async function run() {
  for (const key of keys) {
    const res = await fetch('https://api.numista.com/api/v3/types?issuer=autriche-habsbourg&count=5&page=1&lang=en', {
      headers: { 'Numista-API-Key': key }
    });
    console.log(`Key ${key.substring(0, 5)}... -> ${res.status}`);
  }
}
run();
