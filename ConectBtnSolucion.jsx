import React, { useState, useEffect } from "react";

function BluetoothRead() {
  const [device, setDevice] = useState(null); // Armazena o dispositivo BLE
  const [readData, setReadData] = useState(""); // Dados lidos da característica
  const [error, setError] = useState(""); // Mensagem de erro
  const [connected, setConnected] = useState(false); // Estado de conexão

  // UUIDs para o serviço e característica
  const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca93";
  const CHARACTERISTIC_UUID_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca93";

  let characteristicTx = null; // Referência à característica TX

  // Conecta ao dispositivo BLE
  const connectToDevice = async () => {
    setError(""); // Limpa mensagens de erro
    try {
      console.log("Solicitando dispositivos BLE...");
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BeaconNavigator" }], // Filtrar dispositivos pelo nome
        optionalServices: [SERVICE_UUID],
      });

      setDevice(bleDevice);
      console.log("Dispositivo selecionado:", bleDevice.name);

      // Adiciona evento de desconexão
      bleDevice.addEventListener("gattserverdisconnected", handleDisconnection);

      const server = await bleDevice.gatt.connect();
      setConnected(true);
      console.log("Conectado ao dispositivo BLE:", bleDevice.name);

      const service = await server.getPrimaryService(SERVICE_UUID);
      characteristicTx = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
      console.log("Característica encontrada. Pronto para leitura.");
    } catch (err) {
      setError("Erro ao conectar ao dispositivo BLE. Verifique se o dispositivo está acessível.");
      console.error("Erro ao conectar ao dispositivo BLE:", err);
    }
  };

  // Lê os dados da característica READ
  const readCharacteristic = async () => {
    if (!characteristicTx) {
      setError("Característica não está disponível.");
      return;
    }

    try {
      const value = await characteristicTx.readValue();
      const decoder = new TextDecoder("utf-8");
      const data = decoder.decode(value);
      setReadData(data);
      console.log("Dados lidos da característica:", data);
    } catch (err) {
      setError("Erro ao ler a característica.");
      console.error("Erro ao ler a característica:", err);
    }
  };

  // Manipula desconexão
  const handleDisconnection = () => {
    console.log("Conexão perdida.");
    setConnected(false);
  };

  // Desconecta do dispositivo BLE
  const disconnectDevice = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
      setConnected(false);
      console.log("Dispositivo desconectado.");
    }
  };

  // Limpa conexão ao desmontar o componente
  useEffect(() => {
    return () => {
      if (device && device.gatt.connected) {
        device.gatt.disconnect();
      }
    };
  }, [device]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Leitura BLE (READ)</h1>
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
        onClick={readCharacteristic}
        style={{
          padding: "10px 20px",
          margin: "10px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
        disabled={!connected}
      >
        Ler Dados
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
      <h3>Dados Lidos:</h3>
      <textarea
        value={readData}
        readOnly
        style={{
          width: "100%",
          height: "100px",
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
      <BluetoothRead />
    </div>
  );
}
