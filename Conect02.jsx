import React, { useState, useEffect } from "react";

function BluetoothCommunication() {
  const [device, setDevice] = useState(null); // Armazena o dispositivo BLE
  const [receivedData, setReceivedData] = useState([]); // Dados recebidos (array para partes do JSON)
  const [error, setError] = useState(""); // Mensagem de erro
  const [connected, setConnected] = useState(false); // Estado de conexão

  const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca93";
  const CHARACTERISTIC_UUID_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca93";

  let characteristicTx = null; // Referência à característica TX

  // Conecta ao dispositivo BLE
  const connectToDevice = async () => {
    setError("");
    try {
      console.log("Solicitando dispositivos BLE...");
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BeaconNavigator" }], // Identifica dispositivos pelo nome
        optionalServices: [SERVICE_UUID],
      });

      setDevice(bleDevice);
      console.log("Dispositivo selecionado:", bleDevice.name);

      bleDevice.addEventListener("gattserverdisconnected", handleDisconnection);

      const server = await bleDevice.gatt.connect();
      setConnected(true);
      console.log("Conectado ao dispositivo BLE:", bleDevice.name);

      const service = await server.getPrimaryService(SERVICE_UUID);
      characteristicTx = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);

      // Inscreve-se para receber notificações da característica TX
      await characteristicTx.startNotifications();
      characteristicTx.addEventListener("characteristicvaluechanged", handleNotifications);

      console.log("Notificações ativadas para a característica TX.");
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

      console.log("Parte recebida via BLE:", data);

      // Adiciona a parte ao array de dados recebidos
      setReceivedData((prev) => {
        const updatedData = [...prev, data];

        // Tenta montar o JSON completo
        try {
          const completeJson = JSON.parse(updatedData.join(""));
          console.log("JSON completo recebido:", completeJson);
          return []; // Limpa as partes após o JSON completo
        } catch (err) {
          // Caso ainda não seja um JSON válido, continua adicionando partes
          return updatedData;
        }
      });
    } catch (err) {
      console.error("Erro ao processar notificação BLE:", err);
    }
  };

  // Manipula desconexão e tenta reconectar
  const handleDisconnection = async () => {
    console.log("Conexão perdida. Tentando reconectar...");
    setConnected(false);
    try {
      if (device && !device.gatt.connected) {
        await device.gatt.connect();
        console.log("Reconectado ao dispositivo BLE:", device.name);
        connectToDevice(); // Reinicia o fluxo de conexão
      }
    } catch (err) {
      console.error("Falha ao tentar reconectar:", err);
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

  useEffect(() => {
    // Limpeza ao desmontar o componente
    return () => {
      if (device && device.gatt.connected) {
        device.gatt.disconnect();
      }
    };
  }, [device]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Leitura de Servidor BLE</h1>
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
      <h3>Dados recebidos (Partes):</h3>
      <textarea
        value={receivedData.join("\n")}
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
