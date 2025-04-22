sendWhatSappMessage = async (numbers, message) => {
  const url = `https://graph.facebook.com/v22.0/353824071139279/messages`;
  const token = `${process.env.WHATSAPP_TOKEN}`;
  const payload = {
    messaging_product: "whatsapp",
    to: numbers,
    type: "text",
    text: {
      body: message,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await res.json();
  }

  const data = await res.json();
  return data;
};

module.exports = { sendWhatSappMessage };
