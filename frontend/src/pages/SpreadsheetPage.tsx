import { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { TerminalButton } from "../components/ui/TerminalButton";
import api from "../utils/api";

interface Cell {
  value: string;
}

interface Spreadsheet {
  id: string;
  name: string;
  data: string;
  updatedAt: string;
}

export function SpreadsheetPage() {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [currentSpreadsheet, setCurrentSpreadsheet] =
    useState<Spreadsheet | null>(null);
  const [rows, setRows] = useState<Cell[][]>([
    [{ value: "" }, { value: "" }, { value: "" }],
    [{ value: "" }, { value: "" }, { value: "" }],
    [{ value: "" }, { value: "" }, { value: "" }],
  ]);
  const [columns, setColumns] = useState(["A", "B", "C"]);
  const [spreadsheetName, setSpreadsheetName] = useState("New Spreadsheet");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showMobileList, setShowMobileList] = useState(false);

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  useEffect(() => {
    if (currentSpreadsheet) {
      const timer = setTimeout(() => {
        saveSpreadsheet();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [rows, columns, spreadsheetName]);

  const loadSpreadsheets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/spreadsheets");
      const spreadsheets = response.data;
      setSpreadsheets(spreadsheets);

      if (spreadsheets.length > 0) {
        loadSpreadsheet(spreadsheets[0]);
      }
    } catch (error) {
      console.error("Error loading spreadsheets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpreadsheet = (spreadsheet: Spreadsheet) => {
    setCurrentSpreadsheet(spreadsheet);
    setSpreadsheetName(spreadsheet.name);
    setShowMobileList(false);

    try {
      const data = JSON.parse(spreadsheet.data);
      if (data.rows && data.columns) {
        setRows(data.rows);
        setColumns(data.columns);
      }
    } catch (error) {
      console.error("Error parsing spreadsheet data:", error);
    }
  };

  const saveSpreadsheet = async () => {
    if (!currentSpreadsheet) return;

    setSaveStatus("saving...");
    try {
      const data = JSON.stringify({ rows, columns });
      await api.put(`/spreadsheets/${currentSpreadsheet.id}`, {
        name: spreadsheetName,
        data,
      });
      setSaveStatus("saved ✓");

      setSpreadsheets((prev) =>
        prev.map((s) =>
          s.id === currentSpreadsheet.id
            ? {
                ...s,
                name: spreadsheetName,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Error saving spreadsheet:", error);
      setSaveStatus("error");
    }
  };

  const handleCreateSpreadsheet = async () => {
    try {
      const response = await api.post("/spreadsheets", {
        name: "New Spreadsheet",
        data: JSON.stringify({
          rows: [
            [{ value: "" }, { value: "" }, { value: "" }],
            [{ value: "" }, { value: "" }, { value: "" }],
            [{ value: "" }, { value: "" }, { value: "" }],
          ],
          columns: ["A", "B", "C"],
        }),
      });

      const newSpreadsheet = response.data;
      setSpreadsheets([newSpreadsheet, ...spreadsheets]);
      loadSpreadsheet(newSpreadsheet);
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
    }
  };

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex].value = value;
    setRows(newRows);
  };

  const handleAddRow = () => {
    const newRow = columns.map(() => ({ value: "" }));
    setRows([...rows, newRow]);
  };

  const handleAddColumn = () => {
    const newColumn = String.fromCharCode(65 + columns.length);
    setColumns([...columns, newColumn]);
    setRows(rows.map((row) => [...row, { value: "" }]));
  };

  const handleExportCSV = () => {
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${cell.value.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${spreadsheetName.toLowerCase().replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex h-screen">
      <div className="sidebar-container hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        <div className="p-3 md:p-8">
          {/* Header - Responsivo */}
          <div className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-2">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <h1 className="font-mono text-lg md:text-2xl text-terminal-accent">
                ❯ Spreadsheets
              </h1>
              {isEditingName ? (
                <input
                  value={spreadsheetName}
                  onChange={(e) => setSpreadsheetName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                  }}
                  className="bg-terminal-surface border border-terminal-accent text-terminal-text font-mono px-2 md:px-3 py-1 text-sm md:text-base focus:outline-none w-full md:w-auto"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="font-mono text-xs md:text-sm text-terminal-dim hover:text-terminal-accent truncate max-w-[150px] md:max-w-none"
                >
                  {spreadsheetName} [edit]
                </button>
              )}
              <span className="font-mono text-[10px] md:text-xs text-terminal-dim">
                {saveStatus}
              </span>
            </div>

            {/* Botões responsivos */}
            <div className="flex gap-1 md:gap-2 flex-wrap">
              <button
                onClick={handleCreateSpreadsheet}
                className="px-2 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-[10px] md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors whitespace-nowrap"
              >
                [+ New]
              </button>
              <button
                onClick={handleAddRow}
                className="px-2 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors whitespace-nowrap"
              >
                [+ Row]
              </button>
              <button
                onClick={handleAddColumn}
                className="px-2 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors whitespace-nowrap"
              >
                [+ Col]
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-[10px] md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors whitespace-nowrap"
              >
                [ CSV ]
              </button>
            </div>
          </div>

          {/* Mobile: Lista de planilhas */}
          {spreadsheets.length > 1 && (
            <>
              {/* Botão mobile para mostrar lista */}
              <button
                onClick={() => setShowMobileList(!showMobileList)}
                className="md:hidden w-full px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs mb-2"
              >
                {showMobileList
                  ? "▲ Hide sheets"
                  : "▼ Show sheets (" + (spreadsheets.length - 1) + " more)"}
              </button>

              {/* Lista de planilhas - sempre visível no desktop, toggle no mobile */}
              <div
                className={`flex gap-2 mb-4 overflow-x-auto ${showMobileList ? "" : "hidden md:flex"}`}
              >
                {spreadsheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    onClick={() => loadSpreadsheet(sheet)}
                    className={`px-3 py-1 font-mono text-xs border transition-colors whitespace-nowrap ${
                      currentSpreadsheet?.id === sheet.id
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Spreadsheet Grid */}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <table className="border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="border border-terminal-border bg-terminal-surface p-1.5 md:p-2 font-mono text-[10px] md:text-xs text-terminal-dim w-6 md:w-10">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="border border-terminal-border bg-terminal-surface p-1.5 md:p-2 font-mono text-[10px] md:text-xs text-terminal-accent min-w-[80px] md:min-w-[120px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border border-terminal-border bg-terminal-surface p-1.5 md:p-2 font-mono text-[10px] md:text-xs text-terminal-dim text-center">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-terminal-border p-0"
                      >
                        <input
                          value={cell.value}
                          onChange={(e) =>
                            handleCellChange(rowIndex, colIndex, e.target.value)
                          }
                          className="w-full h-full bg-terminal-bg text-terminal-text font-mono text-xs md:text-sm px-2 py-1.5 md:py-2 focus:outline-none focus:bg-terminal-surface focus:border focus:border-terminal-accent min-w-[80px] md:min-w-[120px]"
                          placeholder={`${columns[colIndex]}${rowIndex + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="mt-3 md:mt-4 font-mono text-[10px] md:text-xs text-terminal-dim">
            {rows.length} rows × {columns.length} columns |{" "}
            {rows.length * columns.length} cells
          </div>
        </div>
      </div>
    </div>
  );
}
