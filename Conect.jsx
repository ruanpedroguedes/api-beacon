import React, { useState } from "react";
import './Conect.css'

function BluetoothButton() {
  const [devices, setDevices] = useState([]); // Lista de dispositivos conectados
  const [error, setError] = useState(null); // Mensagens de erro, se houver

  const handleBluetoothClick = async () => {
    setError(null); // Limpa erros anteriores
    try {
      // Solicita ao usuário um dispositivo Bluetooth
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // Aceita todos os dispositivos
      });

      // Conecta ao dispositivo
      const server = await device.gatt.connect();
      console.log("Conectado ao dispositivo:", device.name);

      // Adiciona o dispositivo conectado à lista
      setDevices((prevDevices) => [
        ...prevDevices,
        `${device.name || "Dispositivo sem nome"} conectado`,
      ]);
    } catch (err) {
      if (err.name === "NotFoundError") {
        setError("Nenhum dispositivo foi selecionado. Tente novamente.");
      } else {
        setError("Erro ao conectar ao dispositivo Bluetooth.");
      }
      console.error("Erro ao acessar dispositivos Bluetooth:", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Controle de Bluetooth</h1>
      <button
        onClick={handleBluetoothClick}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: "5px",
          border: "1px solid #ccc",
          backgroundColor: "#007bff",
        }}
      >
        Conectar via Bluetooth
      </button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>} {/* Exibe erros */}
      <h3>Dispositivos conectados:</h3>
      <ul>
        {devices.length > 0 ? (
          devices.map((device, index) => <li key={index}>{device}</li>)
        ) : (
          <p>Nenhum dispositivo conectado</p>
        )}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <BluetoothButton />
    </div>
  );
}
