import React, { useState, useEffect, useRef } from "react";

export default function BeaconConect() {
  const [device, setDevice] = useState(null);
  const [dataList, setDataList] = useState([]);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const receivedMessages = useRef(new Set());

  const jsonBufferRef = useRef("");
  let characteristicRef = useRef(null);

  const addLogMessage = (message) => {
    setLogMessages((prevLogs) => [...prevLogs, message]);
  };

  const isValidJSON = (string) => {
    try {
      JSON.parse(string);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleChunk = (chunk) => {
    try {
      chunk = chunk.replace(/[^       chunk = chunk.replace(/[^\x20-\x7E]/g, "");
      jsonBufferRef.current += chunk;
      addLogMessage(`Chunk recebido: ${chunk}`);

      if (jsonBufferRef.current.includes("}")) {
        let possibleJSON = jsonBufferRef.current;
        if (isValidJSON(possibleJSON)) {
          const parsedData = JSON.parse(possibleJSON);

          if (parsedData._id && receivedMessages.current.has(parsedData._id)) {
            addLogMessage("Mensagem repetida detectada, ignorando...");
            return;
          }

          if (parsedData._id) {
            receivedMessages.current.add(parsedData._id);
          }

          setDataList((prevList) => [...prevList, parsedData]);
          jsonBufferRef.current = "";
        }
      }
    } catch (e) {
      setError("Erro ao processar chunk recebido.");
      addLogMessage(`Erro ao processar chunk: ${chunk} - ${e.message}`);
    }
  };

  const connectToDevice = async () => {
    try {
      addLogMessage("Solicitando dispositivo BLE...");
      const bleDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca93"],
      });

      addLogMessage(`Dispositivo selecionado: ${bleDevice.name}`);
      setDevice(bleDevice);

      bleDevice.addEventListener("gattserverdisconnected", async () => {
        addLogMessage("Dispositivo desconectado, tentando reconectar...");
        setIsConnected(false);
        await reconnectDevice(bleDevice);
      });

      await establishConnection(bleDevice);
    } catch (e) {
      setError("Erro ao conectar ao dispositivo.");
      addLogMessage(`Erro ao conectar: ${e.message}`);
    }
  };

  const establishConnection = async (bleDevice) => {
    try {
      if (!bleDevice.gatt.connected) {
        await bleDevice.gatt.connect();
      }

      addLogMessage("GATT Server conectado.");
      setIsConnected(true);

      addLogMessage("Obtendo serviço...");
      const service = await bleDevice.gatt.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca93");

      addLogMessage("Obtendo característica...");
      const characteristic = await service.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca93");
      characteristicRef.current = characteristic;

      addLogMessage("Iniciando leitura...");
      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        const value = new TextDecoder().decode(event.target.value);
        handleChunk(value);
      });

      await characteristic.startNotifications();
      addLogMessage("Notificações iniciadas.");
    } catch (e) {
      setError("Erro ao recuperar serviços BLE.");
      addLogMessage(`Erro ao recuperar serviços BLE: ${e.message}`);
    }
  };

  const reconnectDevice = async (bleDevice) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await establishConnection(bleDevice);
    } catch (e) {
      addLogMessage("Falha ao reconectar. Será necessário reconectar manualmente.");
    }
  };

  const disconnectDevice = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
      addLogMessage("Dispositivo desconectado manualmente.");
    }
    setDevice(null);
    setIsConnected(false);
  };

  return (
    <div>
      <h1>Conectar ao Beacon</h1>
      {isConnected ? (
        <div>
          <p>Dispositivo conectado: {device.name}</p>
          <button onClick={disconnectDevice}>Desconectar</button>
        </div>
      ) : (
        <button onClick={connectToDevice}>Conectar</button>
      )}

      <h2>Logs:</h2>
      <div style={{ background: "#f8f8f8", padding: "10px", borderRadius: "5px", maxHeight: "200px", overflowY: "auto" }}>
        {logMessages.map((msg, index) => (
          <p key={index} style={{ margin: "5px 0", fontSize: "12px", fontFamily: "monospace" }}>{msg}</p>
        ))}
      </div>
    </div>
  );
}
