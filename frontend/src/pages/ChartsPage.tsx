import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { TerminalButton } from "../components/ui/TerminalButton";
import api from "../utils/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toPng, toSvg } from "html-to-image";
import { saveAs } from "file-saver";

interface ChartData {
  id?: string;
  name: string;
  chartType: "line" | "bar" | "pie" | "area" | "radar" | "scatter" | "heatmap";
  data: any[];
}

interface Spreadsheet {
  id: string;
  name: string;
  data: string;
}

const COLORS = [
  "#00ff00",
  "#00cc00",
  "#009900",
  "#006600",
  "#00ff88",
  "#88ff00",
  "#00ffff",
  "#ff00ff",
  "#ffff00",
  "#ff8800",
];

export function ChartsPage() {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [currentChart, setCurrentChart] = useState<ChartData>({
    name: "New Chart",
    chartType: "line",
    data: [],
  });
  const [tableData, setTableData] = useState<string[][]>([
    ["Month", "Sales", "Revenue"],
    ["Jan", "100", "5000"],
    ["Feb", "150", "7500"],
    ["Mar", "120", "6000"],
    ["Apr", "180", "9000"],
    ["May", "200", "10000"],
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [showSpreadsheets, setShowSpreadsheets] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [animationDuration, setAnimationDuration] = useState(1000);
  const [showDataTable, setShowDataTable] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCharts();
    loadSpreadsheets();
  }, []);

  const loadCharts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/charts");
      const loadedCharts = response.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        chartType: c.chartType,
        data: JSON.parse(c.data || "[]"),
      }));
      setCharts(loadedCharts);
      if (loadedCharts.length > 0) {
        loadChart(loadedCharts[0]);
      }
    } catch (error) {
      console.error("Error loading charts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpreadsheets = async () => {
    try {
      const response = await api.get("/spreadsheets");
      setSpreadsheets(response.data);
    } catch (error) {
      console.error("Error loading spreadsheets:", error);
    }
  };

  const loadChart = (chart: ChartData) => {
    setCurrentChart(chart);
    if (chart.data.length > 0) {
      const columns = Object.keys(chart.data[0]);
      const newTableData = chart.data.map((row) =>
        columns.map((col) => String(row[col] ?? "")),
      );
      newTableData.unshift(columns);
      setTableData(newTableData);
    }
  };

  const handleSaveChart = async () => {
    setSaveStatus("saving...");
    try {
      const chartData = convertTableToChartData();

      if (currentChart.id) {
        await api.put(`/charts/${currentChart.id}`, {
          name: currentChart.name,
          data: JSON.stringify(chartData),
          chartType: currentChart.chartType,
        });
      } else {
        const response = await api.post("/charts", {
          name: currentChart.name,
          data: JSON.stringify(chartData),
          chartType: currentChart.chartType,
        });
        setCurrentChart({ ...currentChart, id: response.data.id });
      }

      setSaveStatus("saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
      loadCharts();
    } catch (error) {
      console.error("Error saving chart:", error);
      setSaveStatus("error");
    }
  };

  const convertTableToChartData = () => {
    const headers = tableData[0];
    const dataRows = tableData
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim() !== ""));

    return dataRows.map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = row[index] || "";
        obj[header || `col${index}`] =
          isNaN(Number(value)) && value !== "" ? value : Number(value);
      });
      return obj;
    });
  };

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    const newTableData = [...tableData];
    newTableData[rowIndex][colIndex] = value;
    setTableData(newTableData);
  };

  const handleAddRow = () => {
    const newRow = tableData[0].map(() => "");
    setTableData([...tableData, newRow]);
  };

  const handleAddColumn = () => {
    const newCol = `col${tableData[0].length + 1}`;
    const newTableData = tableData.map((row) => [...row, ""]);
    newTableData[0][newTableData[0].length - 1] = newCol;
    setTableData(newTableData);
  };

  const handleImportCSV = () => {
    try {
      const lines = csvContent.trim().split("\n");
      const parsed = lines.map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
      );

      if (parsed.length > 0) {
        setTableData(parsed);
        setShowImport(false);
        setCsvContent("");
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      alert("Error importing CSV");
    }
  };

  const handleImportFromSpreadsheet = (spreadsheet: Spreadsheet) => {
    try {
      const data = JSON.parse(spreadsheet.data);
      if (data.rows && data.columns) {
        const headers = data.columns;
        const rows = data.rows.map((row: any[]) =>
          row.map((cell) => cell.value || ""),
        );
        setTableData([headers, ...rows]);
        setShowSpreadsheets(false);
      }
    } catch (error) {
      console.error("Error importing from spreadsheet:", error);
      alert("Error importing from spreadsheet");
    }
  };

  const handleExportPNG = async () => {
    if (chartRef.current) {
      try {
        const dataUrl = await toPng(chartRef.current, {
          backgroundColor: "#0a0a0a",
        });
        saveAs(
          dataUrl,
          `${currentChart.name.toLowerCase().replace(/\s+/g, "_")}.png`,
        );
      } catch (error) {
        console.error("Error exporting PNG:", error);
      }
    }
  };

  const handleExportSVG = async () => {
    if (chartRef.current) {
      try {
        const dataUrl = await toSvg(chartRef.current, {
          backgroundColor: "#0a0a0a",
        });
        saveAs(
          dataUrl,
          `${currentChart.name.toLowerCase().replace(/\s+/g, "_")}.svg`,
        );
      } catch (error) {
        console.error("Error exporting SVG:", error);
      }
    }
  };

  const animationProps = animationEnabled
    ? { animationDuration, animationEasing: "ease-in-out" as const }
    : { isAnimationActive: false };

  const renderChart = () => {
    const chartData = convertTableToChartData();
    const xKey = tableData[0][0] || "name";
    const yKey = tableData[0][1] || "value";

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 md:h-64 font-mono text-xs md:text-sm text-terminal-dim">
          &lt;insert_data/&gt;
        </div>
      );
    }

    const numericKeys = Object.keys(chartData[0]).filter(
      (key) => key !== xKey && typeof chartData[0][key] === "number",
    );

    // Altura responsiva do gráfico
    const chartHeight = window.innerWidth < 768 ? 280 : 400;

    switch (currentChart.chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey={xKey} stroke="#666666" tick={{ fontSize: 10 }} />
              <YAxis stroke="#666666" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #00ff00",
                  fontFamily: "Roboto Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {numericKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  {...animationProps}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey={xKey} stroke="#666666" tick={{ fontSize: 10 }} />
              <YAxis stroke="#666666" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #00ff00",
                  fontFamily: "Roboto Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {numericKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                  {...animationProps}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        const pieData = chartData.map((row: any) => ({
          name: String(row[xKey]),
          value: Number(row[yKey]) || 0,
        }));
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                outerRadius={window.innerWidth < 768 ? 80 : 150}
                dataKey="value"
                {...animationProps}
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #00ff00",
                  fontFamily: "Roboto Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey={xKey} stroke="#666666" tick={{ fontSize: 10 }} />
              <YAxis stroke="#666666" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #00ff00",
                  fontFamily: "Roboto Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {numericKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                  {...animationProps}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#1f1f1f" />
              <PolarAngleAxis
                dataKey={xKey}
                stroke="#666666"
                tick={{ fill: "#e0e0e0", fontSize: 9 }}
              />
              <PolarRadiusAxis stroke="#666666" tick={{ fontSize: 9 }} />
              {numericKeys.map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                  {...animationProps}
                />
              ))}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #00ff00",
                  fontFamily: "Roboto Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis
                dataKey={xKey}
                stroke="#666666"
                type="number"
                tick={{ fontSize: 10 }}
              />
              <YAxis
                dataKey={yKey}
                stroke="#666666"
                type="number"
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #00ff00",
                  fontFamily: "Roboto Mono",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {numericKeys.slice(1).map((key, index) => (
                <Scatter
                  key={key}
                  name={key}
                  data={chartData}
                  fill={COLORS[index % COLORS.length]}
                  {...animationProps}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "heatmap":
        return (
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="border border-terminal-border p-1 md:p-2 font-mono text-[10px] md:text-xs text-terminal-dim"></th>
                  {numericKeys.map((key) => (
                    <th
                      key={key}
                      className="border border-terminal-border p-1 md:p-2 font-mono text-[10px] md:text-xs text-terminal-accent"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row: any, rowIndex: number) => {
                  const values = numericKeys.map((k) => Number(row[k]) || 0);
                  const maxValue = Math.max(...values, 1);

                  return (
                    <tr key={rowIndex}>
                      <td className="border border-terminal-border p-1 md:p-2 font-mono text-[10px] md:text-xs text-terminal-text">
                        {String(row[xKey])}
                      </td>
                      {numericKeys.map((key) => {
                        const value = Number(row[key]) || 0;
                        const opacity = value / maxValue;
                        const greenIntensity = Math.floor(opacity * 255);

                        return (
                          <td
                            key={key}
                            className="border border-terminal-border p-2 md:p-4 font-mono text-[10px] md:text-xs text-center"
                            style={{
                              backgroundColor: `rgba(0, ${greenIntensity}, 0, 0.6)`,
                              color: opacity > 0.5 ? "#0a0a0a" : "#e0e0e0",
                              transition: "background-color 0.3s ease",
                            }}
                            title={`${key}: ${value}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-2 md:p-4 lg:p-8">
          {/* Header Responsivo */}
          <div className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-2">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <h1 className="font-mono text-lg md:text-2xl text-terminal-accent">
                ❯ Charts
              </h1>
              <input
                value={currentChart.name}
                onChange={(e) =>
                  setCurrentChart({ ...currentChart, name: e.target.value })
                }
                className="bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1 focus:outline-none focus:border-terminal-accent w-24 md:w-auto"
              />
              <span className="font-mono text-[10px] md:text-xs text-terminal-dim">
                {saveStatus}
              </span>
            </div>
            <div className="flex gap-1 md:gap-2 flex-wrap">
              <button
                onClick={handleSaveChart}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-[10px] md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [ Save ]
              </button>
              <button
                onClick={handleExportPNG}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ PNG ]
              </button>
              <button
                onClick={handleExportSVG}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ SVG ]
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ CSV ]
              </button>
              <button
                onClick={() => setShowSpreadsheets(true)}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ 📊 ]
              </button>
            </div>
          </div>

          {/* Animation Controls */}
          <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4 bg-terminal-surface border border-terminal-border p-2 md:p-3 flex-wrap">
            <label className="flex items-center gap-1 md:gap-2 font-mono text-[10px] md:text-xs text-terminal-text">
              <input
                type="checkbox"
                checked={animationEnabled}
                onChange={(e) => setAnimationEnabled(e.target.checked)}
                className="accent-terminal-accent"
              />
              Animations
            </label>
            {animationEnabled && (
              <div className="flex items-center gap-1 md:gap-2">
                <span className="font-mono text-[10px] md:text-xs text-terminal-dim">
                  Duration:
                </span>
                <select
                  value={animationDuration}
                  onChange={(e) => setAnimationDuration(Number(e.target.value))}
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 focus:outline-none"
                >
                  <option value={500}>0.5s</option>
                  <option value={1000}>1s</option>
                  <option value={2000}>2s</option>
                  <option value={3000}>3s</option>
                </select>
              </div>
            )}
            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className="ml-auto font-mono text-[10px] md:text-xs text-terminal-dim hover:text-terminal-accent transition-colors"
            >
              {showDataTable ? "[ Hide Data ]" : "[ Show Data ]"}
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="flex gap-1 md:gap-2 mb-3 md:mb-4 flex-wrap">
            {[
              { type: "line", label: "Line" },
              { type: "bar", label: "Bar" },
              { type: "pie", label: "Pie" },
              { type: "area", label: "Area" },
              { type: "radar", label: "Radar" },
              { type: "scatter", label: "Scatter" },
              { type: "heatmap", label: "Heatmap" },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() =>
                  setCurrentChart({
                    ...currentChart,
                    chartType: item.type as any,
                  })
                }
                className={`px-2 md:px-4 py-1 md:py-2 font-mono text-[10px] md:text-sm border transition-colors ${
                  currentChart.chartType === item.type
                    ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                    : "bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-accent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Saved Charts */}
          {charts.length > 0 && (
            <div className="flex gap-1 md:gap-2 mb-3 md:mb-4 overflow-x-auto pb-1">
              {charts.map((chart) => (
                <button
                  key={chart.id}
                  onClick={() => loadChart(chart)}
                  className={`px-2 md:px-3 py-1 font-mono text-[10px] md:text-xs border transition-colors whitespace-nowrap ${
                    currentChart.id === chart.id
                      ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                      : "bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-accent"
                  }`}
                >
                  {chart.name}
                </button>
              ))}
            </div>
          )}

          {/* Chart Display */}
          <div
            ref={chartRef}
            className="bg-terminal-surface border border-terminal-border p-2 md:p-4 lg:p-6 mb-3 md:mb-8"
          >
            {renderChart()}
          </div>

          {/* Data Table - Toggle on mobile */}
          {showDataTable && (
            <div className="mb-4 md:mb-8">
              <div className="flex items-center justify-between mb-2 md:mb-4 flex-wrap gap-2">
                <h2 className="font-mono text-sm md:text-lg text-terminal-accent">
                  &lt;data/&gt;
                </h2>
                <div className="flex gap-1 md:gap-2">
                  <button
                    onClick={handleAddRow}
                    className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors"
                  >
                    [+ Row]
                  </button>
                  <button
                    onClick={handleAddColumn}
                    className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent transition-colors"
                  >
                    [+ Col]
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse min-w-full">
                  <tbody>
                    {tableData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td
                            key={colIndex}
                            className="border border-terminal-border p-0"
                          >
                            <input
                              value={cell}
                              onChange={(e) =>
                                handleCellChange(
                                  rowIndex,
                                  colIndex,
                                  e.target.value,
                                )
                              }
                              className={`w-full bg-terminal-surface font-mono text-[10px] md:text-sm px-1 md:px-2 py-1 md:py-2 focus:outline-none focus:bg-terminal-bg focus:border focus:border-terminal-accent ${
                                rowIndex === 0
                                  ? "text-terminal-accent"
                                  : "text-terminal-text"
                              }`}
                              placeholder={
                                rowIndex === 0 ? `col${colIndex + 1}` : ""
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import CSV Modal - Responsivo */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-lg">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
              &lt;import_csv/&gt;
            </h3>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm p-2 focus:outline-none focus:border-terminal-accent"
              rows={8}
              placeholder="month,sales,revenue&#10;Jan,100,5000&#10;Feb,150,7500"
            />
            <div className="flex gap-2 mt-3 md:mt-4">
              <button
                onClick={handleImportCSV}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm"
              >
                [ Import ]
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
              >
                [ Cancel ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Spreadsheet Modal - Responsivo */}
      {showSpreadsheets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-md">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
              &lt;import_from_spreadsheet/&gt;
            </h3>
            <div className="space-y-2 max-h-48 md:max-h-60 overflow-y-auto">
              {spreadsheets.length === 0 ? (
                <div className="font-mono text-xs text-terminal-dim">
                  No spreadsheets found
                </div>
              ) : (
                spreadsheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    onClick={() => handleImportFromSpreadsheet(sheet)}
                    className="w-full text-left px-3 md:px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent hover:text-terminal-accent transition-colors"
                  >
                    📊 {sheet.name}
                  </button>
                ))
              )}
            </div>
            <div className="mt-3 md:mt-4">
              <button
                onClick={() => setShowSpreadsheets(false)}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
              >
                [ Cancel ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
