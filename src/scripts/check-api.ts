async function checkApi() {
  try {
    const res = await fetch('http://localhost:3000/api/parking?status=PARKED&search=');
    console.log('HTTP Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkApi();
