import React, { useState } from "react";

function BluetoothCommunication() {
  const [device, setDevice] = useState(null); // Armazena o dispositivo BLE
  const [receivedData, setReceivedData] = useState(""); // Dados recebidos
  const [error, setError] = useState(""); // Mensagem de erro
  const [connected, setConnected] = useState(false); // Estado de conexão

  const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca93";
  const CHARACTERISTIC_UUID_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca93"; // Recebe dados
  const CHARACTERISTIC_UUID_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca93"; // Envia comandos

  let characteristicRx = null; // Referência à característica RX
  let characteristicTx = null; // Referência à característica TX

  // Conecta ao dispositivo BLE
  const connectToDevice = async () => {
    setError("");
    try {
      console.log("Solicitando dispositivos BLE...");
      const bleDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // Alterado para aceitar todos os dispositivos
        optionalServices: [SERVICE_UUID],
      });

      setDevice(bleDevice);
      console.log("Dispositivo selecionado:", bleDevice.name);

      const server = await bleDevice.gatt.connect();
      setConnected(true);
      console.log("Conectado ao dispositivo BLE:", bleDevice.name);

      const service = await server.getPrimaryService(SERVICE_UUID);
      characteristicRx = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
      characteristicTx = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);

      // Inscreva-se para receber notificações da característica TX
      await characteristicTx.startNotifications();
      characteristicTx.addEventListener("characteristicvaluechanged", handleNotifications);

      console.log("Conectado ao serviço e características BLE.");
    } catch (err) {
      setError("Erro ao conectar ao dispositivo BLE. Verifique se o dispositivo está acessível.");
      console.error("Erro ao conectar ao dispositivo BLE:", err);
    }
  };

  // Manipula notificações recebidas da característica TX
  const handleNotifications = (event) => {
    try {
      const value = event.target.value;
      const decoder = new TextDecoder("utf-8");
      const data = decoder.decode(value);
      setReceivedData((prev) => `${prev}\n${data}`);
      console.log("Dados recebidos via BLE:", data);
    } catch (err) {
      console.error("Erro ao processar notificação BLE:", err);
    }
  };

  // Envia comando ao dispositivo pela característica RX
  const sendCommand = async (command) => {
    if (!characteristicRx) {
      setError("Não está conectado ao dispositivo.");
      return;
    }
    try {
      const encoder = new TextEncoder("utf-8");
      const commandEncoded = encoder.encode(command);
      await characteristicRx.writeValue(commandEncoded);
      console.log("Comando enviado:", command);
    } catch (err) {
      setError("Erro ao enviar comando ao dispositivo.");
      console.error("Erro ao enviar comando:", err);
    }
  };

  // Desconecta do dispositivo BLE
  const disconnectDevice = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
      setConnected(false);
      console.log("Dispositivo desconectado.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Comunicação BLE</h1>
      <button
        onClick={connectToDevice}
        style={{
          padding: "10px 20px",
          margin: "10px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: connected ? "#ccc" : "#007bff",
          color: connected ? "#000" : "#fff",
          border: "none",
          borderRadius: "5px",
        }}
        disabled={connected}
      >
        {connected ? "Conectado" : "Conectar ao dispositivo"}
      </button>
      <button
        onClick={disconnectDevice}
        style={{
          padding: "10px 20px",
          margin: "10px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#ff4d4d",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
        disabled={!connected}
      >
        Desconectar
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h3>Enviar comando:</h3>
      <input
        type="text"
        placeholder="Digite o comando"
        onKeyDown={(e) => {
          if (e.key === "Enter") sendCommand(e.target.value);
        }}
        style={{
          padding: "10px",
          width: "300px",
          marginBottom: "10px",
          fontSize: "16px",
        }}
      />
      <h3>Dados recebidos:</h3>
      <textarea
        value={receivedData}
        readOnly
        style={{
          width: "100%",
          height: "200px",
          padding: "10px",
          fontSize: "14px",
        }}
      ></textarea>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <BluetoothCommunication />
    </div>
  );
}
