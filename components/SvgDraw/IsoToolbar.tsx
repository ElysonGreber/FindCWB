"use client";

import {
  Slash,
  Pentagon,
  Trash2,
  Undo2,
  Download,
  FileJson,
  Check,
} from "lucide-react";

export function IsoToolbar({
  colors,
  selectedColor,
  setSelectedColor,
  strokeWidth,
  setStrokeWidth,
  dashed,
  setDashed,
  onFinalize,
  onUndo,
  onClear,
  onExportJSON,
  onExportSVG,

  // 🔹 Novos props para o modo polígono e controle visual
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
}: any) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center space-x-4">
      {/* === CONTROLES PRINCIPAIS === */}
      <button
        onClick={onFinalize}
        className="flex items-center space-x-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        <Check size={16} />
        <span>Novo Path</span>
      </button>

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

      {/* === CORES DAS LINHAS === */}
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

      {/* === MODO LINHA / POLÍGONO === */}
      <div className="ml-6 flex items-center space-x-2">
        {/* Botão modo linha */}
        <button
          onClick={() => {
            setLineMode(true);
            setPolygonMode(false);
          }}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            lineMode ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-blue-500`}
        >
          <Slash size={16} />
          <span>Linha</span>
        </button>

        {/* Botão modo polígono */}
        <button
          onClick={() => {
            setPolygonMode(true);
            setLineMode(false);
          }}
          className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium ${
            polygonMode ? "bg-green-700 text-white" : "bg-gray-600 text-gray-300"
          } hover:bg-green-600`}
        >
          <Pentagon size={16} />
          <span>Polígono</span>
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
            <span>
              {polygonInProgress ? "Finalizar" : "Concluído"}
            </span>
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
