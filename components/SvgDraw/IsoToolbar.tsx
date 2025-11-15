"use client";

import {
  Slash,
  Pentagon,
  Trash2,
  Undo2,
  Download,
  FileJson,
  Check,
  Circle as CircleIcon,
  RailSymbol,
} from "lucide-react";
import { IconOvalVertical, IconPoint } from "@tabler/icons-react";

export function IsoToolbar({
  colors,
  selectedColor,
  setSelectedColor,
  strokeWidth,
  setStrokeWidth,
  dashed,
  setDashed,
  // onFinalize,
  onUndo,
  onClear,
  onExportJSON,
  onExportSVG,

  // 🔹 Modos de desenho
  polygonMode,
  setPolygonMode,
  polygonInProgress,
  fillColor,
  setFillColor,
  fillOpacity,
  setFillOpacity,
  onFinalizePolygon,
  lineMode,
  setLineMode,
  circleMode,
  setCircleMode,
  extendMode,
  setExtendMode,
  setPointMode,
  pointMode,
  setEllipseMode,
  ellipseMode,
}: any) {
  /** ✅ Função que ativa apenas um modo por vez */
  const activateMode = (mode: string) => {
    setLineMode(false);
    setPolygonMode(false);
    setCircleMode(false);
    setExtendMode(false);
    setPointMode(false);
    setEllipseMode(false);

    switch (mode) {
      case "line":
        setLineMode(true);
        break;
      case "polygon":
        setPolygonMode(true);
        break;
      case "circle":
        setCircleMode(true);
        break;
      case "extend":
        setExtendMode(true);
        break;
      case "point":
        setPointMode(true);
        break;
      case "ellipse":
        setEllipseMode(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center space-x-4">
      {/* === CONTROLES PRINCIPAIS === */}
      {/* <button
        onClick={onFinalize}
        className="flex items-center space-x-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        <Check size={16} />
        <span>OK</span>
      </button> */}

      <button
        onClick={onUndo}
        className="flex items-center space-x-2 px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
      >
        <Undo2 size={16} />
        <span>Desfazer</span>
      </button>

      <button
        onClick={onClear}
        className="flex items-center space-x-2 px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
      >
        <Trash2 size={16} />
        <span>Limpar</span>
      </button>

      <button
        onClick={onExportJSON}
        className="flex items-center space-x-2 px-4 py-2 text-white bg-emerald-600 rounded hover:bg-emerald-700"
      >
        <FileJson size={16} />
        <span>JSON</span>
      </button>

      <button
        onClick={onExportSVG}
        className="flex items-center space-x-2 px-4 py-2 text-white bg-yellow-600 rounded hover:bg-yellow-700"
      >
        <Download size={16} />
        <span>SVG</span>
      </button>

      {/* === CORES === */}
      <div className="flex items-center space-x-2 ml-6">
        {colors.map((c: string) => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            className={`w-6 h-6 rounded-full border-2 ${
              selectedColor === c ? "border-white" : "border-gray-600"
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* === ESPESSURA === */}
      <div className="ml-4 flex items-center space-x-2 text-white">
        <span>Espessura:</span>
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
        />
        <span>{strokeWidth}px</span>
      </div>

      {/* === TIPO DE LINHA === */}
      <div className="ml-4 flex items-center space-x-2 text-white">
        <span>Linha:</span>
        <button
          onClick={() => setDashed((p: boolean) => !p)}
          className={`px-3 py-1 rounded text-sm ${
            dashed ? "bg-gray-700" : "bg-gray-500"
          }`}
        >
          {dashed ? "Pontilhada" : "Contínua"}
        </button>
      </div>

      {/* === MODOS === */}
      <div className="ml-6 flex items-center space-x-2">
        {/* Linha */}
        <button
          onClick={() => activateMode("line")}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            lineMode ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-blue-500`}
        >
          <Slash size={16} />
          <span>Linha</span>
        </button>

        {/* Ponto */}
        <button
          onClick={() => activateMode("point")}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            pointMode ? "bg-cyan-600 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-cyan-500`}
        >
          <IconPoint size={16} />
          <span>Ponto</span>
        </button>

        {/* Polígono */}
        <button
          onClick={() => activateMode("polygon")}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            polygonMode ? "bg-green-700 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-green-600`}
        >
          <Pentagon size={16} />
          <span>Polígono</span>
        </button>

        {/* Círculo */}
        <button
          onClick={() => activateMode("circle")}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            circleMode ? "bg-purple-700 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-purple-600`}
        >
          <CircleIcon size={16} />
          <span>Círculo</span>
        </button>

        {/* Elipse */}
        <button
          onClick={() => activateMode("ellipse")}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            ellipseMode ? "bg-pink-700 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-pink-600`}
        >
          <IconOvalVertical size={16} />
          <span>Elipse</span>
        </button>

        {/* Extensão */}
        <button
          onClick={() => activateMode("extend")}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            extendMode ? "bg-amber-600 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-amber-500`}
        >
          <RailSymbol size={16} />
          <span>Extensão</span>
        </button>

        {/* Botão finalizar polígono */}
        {polygonMode && (
          <button
            onClick={onFinalizePolygon}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
              polygonInProgress
                ? "bg-red-700 text-white hover:bg-red-600"
                : "bg-emerald-700 text-white hover:bg-emerald-600"
            }`}
          >
            <Check size={16} />
            <span>{polygonInProgress ? "Finalizar" : "Concluído"}</span>
          </button>
        )}
      </div>

      {/* === COR DE PREENCHIMENTO === */}
      <div className="ml-4 flex items-center space-x-2 text-white">
        <label className="text-sm">Cor:</label>
        <input
          type="color"
          value={fillColor}
          onChange={(e) => setFillColor(e.target.value)}
          className="w-8 h-8 cursor-pointer rounded border border-gray-500"
        />
      </div>

      {/* === OPACIDADE === */}
      <div className="ml-4 flex items-center space-x-2 text-white">
        <label className="text-sm">Opacidade:</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={fillOpacity}
          onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
        />
        <span>{Math.round(fillOpacity * 100)}%</span>
      </div>
    </div>
  );
}
