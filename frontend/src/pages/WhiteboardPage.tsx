import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import {
  getWhiteboards,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  type Whiteboard,
} from "../api/whiteboards";

type Tool =
  | "select"
  | "pen"
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "eraser"
  | "triangle"
  | "diamond"
  | "star"
  | "hexagon";

interface DrawingElement {
  id: string;
  type: string;
  points?: { x: number; y: number }[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  fontSize?: number;
  fillColor?: string;
  opacity?: number;
  rotation?: number;
  dash?: number[];
  layer?: number;
}

const PRESET_COLORS = [
  "#00ff00",
  "#ff0000",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ffffff",
  "#ff8800",
  "#88ff00",
  "#0088ff",
  "#ff0088",
  "#8800ff",
  "#00ff88",
  "#ff4444",
  "#44ff44",
  "#4444ff",
  "#cccccc",
  "#666666",
];

export function WhiteboardPage() {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Whiteboard | null>(null);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>("pen");
  const [selectedColor, setSelectedColor] = useState("#00ff00");
  const [customColor, setCustomColor] = useState("#00ff00");
  const [fillColor, setFillColor] = useState("");
  const [opacity, setOpacity] = useState(100);
  const [dashStyle, setDashStyle] = useState<number[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(
    null,
  );
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffsets, setDragOffsets] = useState<{ x: number; y: number }[]>(
    [],
  );
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [saveStatus, setSaveStatus] = useState("");
  const [undoStack, setUndoStack] = useState<DrawingElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingElement[][]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(30);
  const [backgroundColor, setBackgroundColor] = useState("#0a0a0a");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elementsRef = useRef<DrawingElement[]>([]);
  const currentBoardRef = useRef<Whiteboard | null>(null);

  // Manter refs atualizadas
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    currentBoardRef.current = currentBoard;
  }, [currentBoard]);

  // Redimensionar canvas
  useEffect(() => {
    const resizeCanvas = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setCanvasSize({ width, height });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Salvar ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const board = currentBoardRef.current;
      const elementsData = elementsRef.current;
      if (board && elementsData.length > 0) {
        updateWhiteboard(board.id, {
          data: JSON.stringify(elementsData),
        }).catch((err) => console.error("Error saving on unmount:", err));
      }
    };
  }, []);

  // Load whiteboards
  useEffect(() => {
    loadWhiteboards();
  }, []);

  // Auto-save com debounce
  useEffect(() => {
    if (currentBoard && elements.length > 0) {
      setSaveStatus("typing...");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 1000);
    }
  }, [elements, currentBoard]);

  // Redraw canvas
  useEffect(() => {
    drawCanvas();
  }, [
    elements,
    currentElement,
    isDrawing,
    canvasSize,
    zoom,
    panOffset,
    selectedElements,
    showGrid,
    gridSize,
    backgroundColor,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleDuplicateSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "+" || e.key === "=") {
        handleZoom(0.1);
      }
      if (e.key === "-") {
        handleZoom(-0.1);
      }
      if (e.key === "0") {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
      // Tool shortcuts
      if (e.key === "v" || e.key === "V") setSelectedTool("select");
      if (e.key === "p" || e.key === "P") setSelectedTool("pen");
      if (e.key === "r" || e.key === "R") setSelectedTool("rectangle");
      if (e.key === "e" || e.key === "E") setSelectedTool("ellipse");
      if (e.key === "l" || e.key === "L") setSelectedTool("line");
      if (e.key === "t" || e.key === "T") setSelectedTool("text");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElements, elements]);

  const loadWhiteboards = async () => {
    try {
      const data = await getWhiteboards();
      setWhiteboards(data);
      if (data.length > 0) {
        loadWhiteboard(data[0]);
      }
    } catch (error) {
      console.error("Error loading whiteboards:", error);
    }
  };

  const loadWhiteboard = (board: Whiteboard) => {
    if (currentBoardRef.current && elementsRef.current.length > 0) {
      updateWhiteboard(currentBoardRef.current.id, {
        data: JSON.stringify(elementsRef.current),
      }).catch((err) => console.error("Error saving before switch:", err));
    }

    setCurrentBoard(board);
    currentBoardRef.current = board;
    try {
      const parsedElements = JSON.parse(board.data || "[]");
      setElements(parsedElements);
      elementsRef.current = parsedElements;
    } catch (e) {
      setElements([]);
      elementsRef.current = [];
    }
    setSelectedElements([]);
  };

  const handleNewWhiteboard = async () => {
    if (currentBoardRef.current && elementsRef.current.length > 0) {
      await updateWhiteboard(currentBoardRef.current.id, {
        data: JSON.stringify(elementsRef.current),
      }).catch((err) => console.error("Error saving before new:", err));
    }

    try {
      const newBoard = await createWhiteboard({
        name: `Whiteboard ${whiteboards.length + 1}`,
        data: "[]",
        icon: "🎨",
      });
      setWhiteboards([newBoard, ...whiteboards]);
      setCurrentBoard(newBoard);
      currentBoardRef.current = newBoard;
      setElements([]);
      elementsRef.current = [];
      setSelectedElements([]);
    } catch (error) {
      console.error("Error creating whiteboard:", error);
    }
  };

  const handleSave = async () => {
    const board = currentBoardRef.current;
    const elementsData = elementsRef.current;

    if (!board) return;

    setSaveStatus("saving...");
    try {
      const updated = await updateWhiteboard(board.id, {
        data: JSON.stringify(elementsData),
      });

      setWhiteboards((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w)),
      );
      setCurrentBoard(updated);
      currentBoardRef.current = updated;

      setSaveStatus("saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      setSaveStatus("error");
    }
  };

  const handleDeleteWhiteboard = async (board: Whiteboard) => {
    if (window.confirm(`Delete "${board.name}"?`)) {
      try {
        await deleteWhiteboard(board.id);
        const remaining = whiteboards.filter((b) => b.id !== board.id);
        setWhiteboards(remaining);
        if (currentBoard?.id === board.id) {
          if (remaining.length > 0) {
            loadWhiteboard(remaining[0]);
          } else {
            setCurrentBoard(null);
            currentBoardRef.current = null;
            setElements([]);
            elementsRef.current = [];
          }
        }
      } catch (error) {
        console.error("Error deleting whiteboard:", error);
      }
    }
  };

  const getCanvasCoordinates = (
    e: React.MouseEvent,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - panOffset.x;
    const y = (e.clientY - rect.top) / zoom - panOffset.y;
    return { x, y };
  };

  const getElementBounds = (el: DrawingElement) => {
    if (el.type === "pen" && el.points && el.points.length > 0) {
      const xs = el.points.map((p) => p.x);
      const ys = el.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }
    if (el.x1 !== undefined && el.x2 !== undefined) {
      return {
        minX: Math.min(el.x1, el.x2),
        minY: Math.min(el.y1!, el.y2!),
        maxX: Math.max(el.x1, el.x2),
        maxY: Math.max(el.y1!, el.y2!),
      };
    }
    return null;
  };

  const isPointInElement = (
    el: DrawingElement,
    pos: { x: number; y: number },
  ): boolean => {
    if (el.type === "pen" && el.points) {
      return el.points.some(
        (p) => Math.abs(p.x - pos.x) < 15 && Math.abs(p.y - pos.y) < 15,
      );
    }
    if (el.type === "text") {
      return (
        Math.abs((el.x1 || 0) - pos.x) < 80 &&
        Math.abs((el.y1 || 0) - pos.y) < 30
      );
    }
    const minX = Math.min(el.x1 || 0, el.x2 || 0);
    const maxX = Math.max(el.x1 || 0, el.x2 || 0);
    const minY = Math.min(el.y1 || 0, el.y2 || 0);
    const maxY = Math.max(el.y1 || 0, el.y2 || 0);
    return (
      pos.x >= minX - 10 &&
      pos.x <= maxX + 10 &&
      pos.y >= minY - 10 &&
      pos.y <= maxY + 10
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button === 2) {
      return;
    }

    const pos = getCanvasCoordinates(e);

    if (selectedTool === "select") {
      const clickedElement = [...elementsRef.current]
        .reverse()
        .find((el) => isPointInElement(el, pos));

      if (clickedElement) {
        if (e.ctrlKey || e.metaKey) {
          setSelectedElements((prev) =>
            prev.includes(clickedElement.id)
              ? prev.filter((id) => id !== clickedElement.id)
              : [...prev, clickedElement.id],
          );
        } else {
          setSelectedElements([clickedElement.id]);
        }
        setIsDragging(true);
        setDragStart(pos);
        return;
      }

      setSelectedElements([]);
      return;
    }

    if (selectedTool === "text") {
      setTextPosition(pos);
      setShowTextInput(true);
      setTextInput("");
      return;
    }

    if (selectedTool === "eraser") {
      const newElements = elementsRef.current.filter(
        (el) => !isPointInElement(el, pos),
      );
      setUndoStack([...undoStack, elementsRef.current]);
      setRedoStack([]);
      setElements(newElements);
      elementsRef.current = newElements;
      return;
    }

    setUndoStack([...undoStack, elementsRef.current]);
    setRedoStack([]);
    setIsDrawing(true);

    const newElement: DrawingElement = {
      id: `element-${Date.now()}`,
      type: selectedTool,
      color: selectedColor,
      strokeWidth,
      fillColor: fillColor || undefined,
      opacity,
      dash: dashStyle.length > 0 ? dashStyle : undefined,
      fontSize : undefined,
      points: selectedTool === "pen" ? [pos] : undefined,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y,
    };
    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset((prev) => ({
        x: prev.x + dx / zoom,
        y: prev.y + dy / zoom,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragging && selectedElements.length > 0) {
      const pos = getCanvasCoordinates(e);
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      const newElements = elementsRef.current.map((el) => {
        if (!selectedElements.includes(el.id)) return el;

        if (el.type === "pen" && el.points) {
          return {
            ...el,
            points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          };
        }

        return {
          ...el,
          x1: (el.x1 || 0) + dx,
          y1: (el.y1 || 0) + dy,
          x2: (el.x2 || 0) + dx,
          y2: (el.y2 || 0) + dy,
        };
      });

      setElements(newElements);
      elementsRef.current = newElements;
      setDragStart(pos);
      return;
    }

    if (!isDrawing || !currentElement) return;
    const pos = getCanvasCoordinates(e);

    if (currentElement.type === "pen" && currentElement.points) {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, pos],
      });
    } else {
      setCurrentElement({
        ...currentElement,
        x2: pos.x,
        y2: pos.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    setIsPanning(false);

    if (isDrawing && currentElement) {
      const newElements = [...elementsRef.current, currentElement];
      setElements(newElements);
      elementsRef.current = newElements;
      setCurrentElement(null);
      setIsDrawing(false);
    }
  };

  const handleAddText = () => {
    if (!textInput.trim()) {
      setShowTextInput(false);
      return;
    }

    const newElement: DrawingElement = {
      id: `text-${Date.now()}`,
      type: "text",
      text: textInput.trim(),
      color: selectedColor,
      strokeWidth: 1,
      fontSize,
      opacity,
      x1: textPosition.x,
      y1: textPosition.y,
      x2: textPosition.x,
      y2: textPosition.y,
    };

    const newElements = [...elementsRef.current, newElement];
    setElements(newElements);
    elementsRef.current = newElements;
    setShowTextInput(false);
    setTextInput("");
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack([...redoStack, elementsRef.current]);
    setUndoStack(undoStack.slice(0, -1));
    setElements(previousState);
    elementsRef.current = previousState;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack([...undoStack, elementsRef.current]);
    setRedoStack(redoStack.slice(0, -1));
    setElements(nextState);
    elementsRef.current = nextState;
  };

  const handleClearAll = () => {
    if (window.confirm("Clear entire whiteboard?")) {
      setUndoStack([...undoStack, elementsRef.current]);
      setRedoStack([]);
      setElements([]);
      elementsRef.current = [];
      setSelectedElements([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedElements.length === 0) return;
    setUndoStack([...undoStack, elementsRef.current]);
    setRedoStack([]);
    const newElements = elementsRef.current.filter(
      (el) => !selectedElements.includes(el.id),
    );
    setElements(newElements);
    elementsRef.current = newElements;
    setSelectedElements([]);
  };

  const handleDuplicateSelected = () => {
    if (selectedElements.length === 0) return;
    const duplicated = elementsRef.current
      .filter((el) => selectedElements.includes(el.id))
      .map((el) => ({
        ...el,
        id: `element-${Date.now()}-${Math.random()}`,
        x1: (el.x1 || 0) + 30,
        y1: (el.y1 || 0) + 30,
        x2: (el.x2 || 0) + 30,
        y2: (el.y2 || 0) + 30,
        points: el.points?.map((p) => ({ x: p.x + 30, y: p.y + 30 })),
      }));

    setElements([...elementsRef.current, ...duplicated]);
    elementsRef.current = [...elementsRef.current, ...duplicated];
    setSelectedElements(duplicated.map((el) => el.id));
  };

  const handleBringForward = () => {
    if (selectedElements.length === 0) return;
    const newElements = [...elementsRef.current];
    const selectedIdx = newElements
      .map((el, i) => (selectedElements.includes(el.id) ? i : -1))
      .filter((i) => i !== -1)
      .sort((a, b) => b - a);

    for (const idx of selectedIdx) {
      if (idx < newElements.length - 1) {
        [newElements[idx], newElements[idx + 1]] = [
          newElements[idx + 1],
          newElements[idx],
        ];
      }
    }

    setElements(newElements);
    elementsRef.current = newElements;
  };

  const handleSendBackward = () => {
    if (selectedElements.length === 0) return;
    const newElements = [...elementsRef.current];
    const selectedIdx = newElements
      .map((el, i) => (selectedElements.includes(el.id) ? i : -1))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);

    for (const idx of selectedIdx) {
      if (idx > 0) {
        [newElements[idx], newElements[idx - 1]] = [
          newElements[idx - 1],
          newElements[idx],
        ];
      }
    }

    setElements(newElements);
    elementsRef.current = newElements;
  };

  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(3, Math.max(0.25, prev + factor)));
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);

    if (showGrid) {
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 0.5 / zoom;
      for (let x = 0; x < canvas.width / zoom; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -panOffset.y);
        ctx.lineTo(x, canvas.height / zoom - panOffset.y);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height / zoom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-panOffset.x, y);
        ctx.lineTo(canvas.width / zoom - panOffset.x, y);
        ctx.stroke();
      }
    }

    const allElements = currentElement
      ? [...elementsRef.current, currentElement]
      : elementsRef.current;

    for (const el of allElements) {
      ctx.save();
      ctx.globalAlpha = (el.opacity ?? 100) / 100;
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.fillColor || "transparent";
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(el.dash || []);

      const isSelected = selectedElements.includes(el.id);
      if (isSelected) {
        ctx.shadowColor = el.color;
        ctx.shadowBlur = 8;
      }

      switch (el.type) {
        case "pen":
          if (el.points && el.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
              ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.stroke();
          }
          break;

        case "rectangle":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            const w = el.x2 - el.x1;
            const h = el.y2! - el.y1!;
            if (el.fillColor) ctx.fillRect(el.x1, el.y1!, w, h);
            ctx.strokeRect(el.x1, el.y1!, w, h);
          }
          break;

        case "ellipse":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            ctx.beginPath();
            ctx.ellipse(
              (el.x1 + el.x2) / 2,
              (el.y1! + el.y2!) / 2,
              Math.abs(el.x2 - el.x1) / 2,
              Math.abs(el.y2! - el.y1!) / 2,
              0,
              0,
              Math.PI * 2,
            );
            if (el.fillColor) ctx.fill();
            ctx.stroke();
          }
          break;

        case "triangle":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            ctx.beginPath();
            ctx.moveTo((el.x1 + el.x2) / 2, el.y1!);
            ctx.lineTo(el.x2, el.y2!);
            ctx.lineTo(el.x1, el.y2!);
            ctx.closePath();
            if (el.fillColor) ctx.fill();
            ctx.stroke();
          }
          break;

        case "diamond":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            const cx = (el.x1 + el.x2) / 2;
            const cy = (el.y1! + el.y2!) / 2;
            const w = Math.abs(el.x2 - el.x1) / 2;
            const h = Math.abs(el.y2! - el.y1!) / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - h);
            ctx.lineTo(cx + w, cy);
            ctx.lineTo(cx, cy + h);
            ctx.lineTo(cx - w, cy);
            ctx.closePath();
            if (el.fillColor) ctx.fill();
            ctx.stroke();
          }
          break;

        case "star":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            const cx = (el.x1 + el.x2) / 2;
            const cy = (el.y1! + el.y2!) / 2;
            const outerR = Math.abs(el.x2 - el.x1) / 2;
            const innerR = outerR * 0.4;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? outerR : innerR;
              const angle = (i * Math.PI) / 5 - Math.PI / 2;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            if (el.fillColor) ctx.fill();
            ctx.stroke();
          }
          break;

        case "hexagon":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            const cx = (el.x1 + el.x2) / 2;
            const cy = (el.y1! + el.y2!) / 2;
            const r = Math.abs(el.x2 - el.x1) / 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3 - Math.PI / 6;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            if (el.fillColor) ctx.fill();
            ctx.stroke();
          }
          break;

        case "line":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            ctx.beginPath();
            ctx.moveTo(el.x1, el.y1!);
            ctx.lineTo(el.x2, el.y2!);
            ctx.stroke();
          }
          break;

        case "arrow":
          if (el.x1 !== undefined && el.x2 !== undefined) {
            ctx.beginPath();
            ctx.moveTo(el.x1, el.y1!);
            ctx.lineTo(el.x2, el.y2!);
            ctx.stroke();

            const angle = Math.atan2(el.y2! - el.y1!, el.x2 - el.x1);
            const headLength = 14;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(el.x2, el.y2!);
            ctx.lineTo(
              el.x2 - headLength * Math.cos(angle - Math.PI / 6),
              el.y2! - headLength * Math.sin(angle - Math.PI / 6),
            );
            ctx.moveTo(el.x2, el.y2!);
            ctx.lineTo(
              el.x2 - headLength * Math.cos(angle + Math.PI / 6),
              el.y2! - headLength * Math.sin(angle + Math.PI / 6),
            );
            ctx.stroke();
          }
          break;

        case "text":
          if (el.text) {
            ctx.font = `${el.fontSize || 16}px "Roboto Mono", monospace`;
            ctx.textBaseline = "top";
            ctx.fillText(el.text, el.x1!, el.y1!);
          }
          break;
      }

      if (isSelected) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1 / zoom;
        ctx.shadowBlur = 0;

        const bounds = getElementBounds(el);
        if (bounds) {
          ctx.strokeRect(
            bounds.minX - 5,
            bounds.minY - 5,
            bounds.maxX - bounds.minX + 10,
            bounds.maxY - bounds.minY + 10,
          );
        }
      }

      ctx.restore();
    }
  }, [
    elements,
    currentElement,
    isDrawing,
    canvasSize,
    zoom,
    panOffset,
    selectedElements,
    showGrid,
    gridSize,
    backgroundColor,
  ]);

  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: "select", icon: "⬚", label: "Select (V)" },
    { id: "pen", icon: "✏️", label: "Pen (P)" },
    { id: "rectangle", icon: "▭", label: "Rectangle (R)" },
    { id: "ellipse", icon: "⬭", label: "Ellipse (E)" },
    { id: "triangle", icon: "△", label: "Triangle" },
    { id: "diamond", icon: "◇", label: "Diamond" },
    { id: "star", icon: "★", label: "Star" },
    { id: "hexagon", icon: "⬡", label: "Hexagon" },
    { id: "line", icon: "╱", label: "Line (L)" },
    { id: "arrow", icon: "→", label: "Arrow" },
    { id: "text", icon: "T", label: "Text (T)" },
    { id: "eraser", icon: "⌫", label: "Eraser" },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden bg-terminal-bg">
        {/* Whiteboard List Sidebar */}
        <div className="w-48 md:w-56 border-r border-terminal-border bg-terminal-surface flex flex-col">
          <div className="p-2 md:p-3 border-b border-terminal-border">
            <button
              onClick={handleNewWhiteboard}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
            >
              [ + New Board ]
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {whiteboards.map((board) => (
              <div
                key={board.id}
                className={`group flex items-center px-2 md:px-3 py-1.5 md:py-2 cursor-pointer ${
                  currentBoard?.id === board.id
                    ? "bg-terminal-bg border-l-2 border-terminal-accent"
                    : "hover:bg-terminal-bg border-l-2 border-transparent"
                }`}
                onClick={() => loadWhiteboard(board)}
              >
                <span className="mr-1 md:mr-2 text-sm">
                  {board.icon || "🎨"}
                </span>
                <span className="flex-1 font-mono text-[10px] md:text-xs text-terminal-text truncate">
                  {board.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWhiteboard(board);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-terminal-dim hover:text-red-500 text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar Principal */}
          <div className="p-1.5 md:p-2 border-b border-terminal-border flex items-center gap-0.5 md:gap-1 flex-wrap">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`px-1.5 md:px-2.5 py-1 md:py-1.5 font-mono text-[10px] md:text-xs border transition-colors ${
                  selectedTool === tool.id
                    ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                    : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                }`}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          {/* Toolbar de Customização */}
          <div className="p-1.5 md:p-2 border-b border-terminal-border flex items-center gap-1 md:gap-2 flex-wrap overflow-x-auto">
            {/* Cores */}
            <div className="flex items-center gap-1">
              {PRESET_COLORS.slice(0, 12).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all shrink-0 ${
                    selectedColor === color
                      ? "border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-terminal-border bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                  title="Custom color"
                />
                {showColorPicker && (
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setSelectedColor(e.target.value);
                    }}
                    className="absolute top-full left-0 mt-1 z-50"
                  />
                )}
              </div>
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Fill Color */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
                Fill:
              </span>
              <button
                onClick={() => setFillColor("")}
                className={`w-4 h-4 border ${!fillColor ? "bg-white" : "bg-terminal-bg"}`}
                title="No fill"
              />
              {PRESET_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  onClick={() => setFillColor(color)}
                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full border ${fillColor === color ? "border-white" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Stroke Width */}
            <div className="flex items-center gap-0.5 md:gap-1">
              <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
                Size:
              </span>
              {[1, 2, 3, 4, 6, 8, 10, 15].map((size) => (
                <button
                  key={size}
                  onClick={() => setStrokeWidth(size)}
                  className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border ${
                    strokeWidth === size
                      ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                      : "bg-terminal-bg text-terminal-text border-terminal-border"
                  }`}
                >
                  <span
                    style={{
                      width: Math.min(size, 10),
                      height: Math.min(size, 10),
                      backgroundColor: "currentColor",
                      borderRadius: "50%",
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Opacity */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
                Opacity:
              </span>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-16 md:w-24 accent-terminal-accent"
              />
              <span className="font-mono text-[9px] text-terminal-dim">
                {opacity}%
              </span>
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Dash Style */}
            <div className="flex items-center gap-0.5 md:gap-1">
              <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
                Style:
              </span>
              <button
                onClick={() => setDashStyle([])}
                className={`px-1.5 py-0.5 border text-[10px] ${dashStyle.length === 0 ? "bg-terminal-accent text-terminal-bg" : "bg-terminal-bg text-terminal-text border-terminal-border"}`}
              >
                ──
              </button>
              <button
                onClick={() => setDashStyle([8, 4])}
                className={`px-1.5 py-0.5 border text-[10px] ${dashStyle.length > 0 && dashStyle[0] === 8 ? "bg-terminal-accent text-terminal-bg" : "bg-terminal-bg text-terminal-text border-terminal-border"}`}
              >
                ┄┄
              </button>
              <button
                onClick={() => setDashStyle([2, 4])}
                className={`px-1.5 py-0.5 border text-[10px] ${dashStyle.length > 0 && dashStyle[0] === 2 ? "bg-terminal-accent text-terminal-bg" : "bg-terminal-bg text-terminal-text border-terminal-border"}`}
              >
                ···
              </button>
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Font Size */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
                Font:
              </span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-[10px] px-1 py-0.5"
              >
                {[10, 12, 14, 16, 20, 24, 32, 48].map((s) => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Grid Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-1.5 py-0.5 border text-[10px] ${showGrid ? "bg-terminal-accent text-terminal-bg" : "bg-terminal-bg text-terminal-text border-terminal-border"}`}
                title="Toggle grid"
              >
                Grid
              </button>
              {showGrid && (
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-[10px] px-1 py-0.5"
                >
                  <option value={15}>15px</option>
                  <option value={30}>30px</option>
                  <option value={50}>50px</option>
                  <option value={100}>100px</option>
                </select>
              )}
            </div>

            <div className="w-px h-5 bg-terminal-border mx-1 shrink-0" />

            {/* Undo/Redo/Delete/Duplicate/Layers */}
            <button
              onClick={handleUndo}
              className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
            <button
              onClick={handleDuplicateSelected}
              className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
              title="Duplicate (Ctrl+D)"
            >
              ⧉
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-1.5 py-1 text-xs border border-red-500 bg-terminal-bg text-red-500 hover:bg-red-500 hover:text-terminal-bg"
              title="Delete (Del)"
            >
              ✕
            </button>
            <button
              onClick={handleBringForward}
              className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
              title="Bring Forward"
            >
              ⬆
            </button>
            <button
              onClick={handleSendBackward}
              className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
              title="Send Backward"
            >
              ⬇
            </button>
            <button
              onClick={handleClearAll}
              className="px-1.5 py-1 text-xs border border-red-500 bg-terminal-bg text-red-500 hover:bg-red-500 hover:text-terminal-bg"
              title="Clear All"
            >
              🗑
            </button>

            <div className="ml-auto flex items-center gap-1 md:gap-2">
              {/* Zoom Controls */}
              <button
                onClick={() => handleZoom(-0.1)}
                className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text"
              >
                −
              </button>
              <span className="font-mono text-[10px] text-terminal-dim">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text"
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-1.5 py-1 text-xs border border-terminal-border bg-terminal-bg text-terminal-text"
              >
                Fit
              </button>

              <span className="font-mono text-[9px] text-terminal-dim">
                {saveStatus}
              </span>
              <button
                onClick={handleSave}
                className="px-2 md:px-3 py-1 font-mono text-[10px] md:text-xs border border-terminal-accent bg-terminal-bg text-terminal-accent hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [ Save ]
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden"
            style={{ minHeight: "400px" }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair"
              style={{ width: "100%", height: "100%" }}
            />

            {showTextInput && (
              <div
                className="absolute"
                style={{
                  left: textPosition.x * zoom + panOffset.x,
                  top: textPosition.y * zoom + panOffset.y,
                }}
              >
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddText();
                    if (e.key === "Escape") setShowTextInput(false);
                  }}
                  onBlur={handleAddText}
                  className="bg-terminal-bg border border-terminal-accent text-terminal-text font-mono px-2 py-1 focus:outline-none"
                  autoFocus
                  placeholder="Type text..."
                  style={{ color: selectedColor, fontSize: `${fontSize}px` }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-2 md:px-3 py-1 border-t border-terminal-border flex items-center justify-between flex-wrap">
            <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
              Elements: {elements.length} | Selected: {selectedElements.length}{" "}
              | Zoom: {Math.round(zoom * 100)}%
            </span>
            <span className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
              {currentBoard?.name || "No board selected"} | V=Select P=Pen
              R=Rect E=Ellipse L=Line T=Text
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
