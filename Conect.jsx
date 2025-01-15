import React, { useState } from "react";

function BluetoothButton() {
  const [devices, setDevices] = useState([]); // Lista de dispositivos encontrados
  const [error, setError] = useState(null); // Mensagem de erro, se houver

  const handleBluetoothClick = async () => {
    setError(null); // Limpa erros anteriores
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service"], // Serviços opcionais
      });

      // Adiciona o dispositivo selecionado à lista
      setDevices((prevDevices) => [...prevDevices, device.name || "Dispositivo sem nome"]);
    } catch (err) {
      if (err.name === "NotFoundError") {
        setError("Nenhum dispositivo foi selecionado. Tente novamente.");
      } else {
        setError("Ocorreu um erro ao acessar os dispositivos Bluetooth.");
      }
      console.error("Erro ao acessar dispositivos Bluetooth:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={handleBluetoothClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Bluetooth
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>} {/* Exibe a mensagem de erro */}
      <h3>Dispositivos disponíveis:</h3>
      <ul>
        {devices.length > 0 ? (
          devices.map((device, index) => <li key={index}>{device}</li>)
        ) : (
          <p>Nenhum dispositivo encontrado</p>
        )}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <h1>Controle de Bluetooth</h1>
      <BluetoothButton />
    </div>
  );
}
