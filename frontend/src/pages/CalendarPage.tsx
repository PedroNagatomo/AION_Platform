import { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TerminalButton } from '../components/ui/TerminalButton';
import { TerminalInput } from '../components/ui/TerminalInput';
import api from '../utils/api';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '09:00',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/calendar');
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (newEvent.title.trim()) {
      try {
        const response = await api.post('/calendar', {
          title: newEvent.title.trim(),
          date: selectedDate,
          time: newEvent.time,
          description: newEvent.description.trim() || undefined,
        });
        
        setEvents([...events, response.data]);
        setNewEvent({ title: '', time: '09:00', description: '' });
        setShowAddEvent(false);
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  const handleUpdateEvent = async () => {
    if (editingEvent) {
      try {
        const response = await api.put(`/calendar/${editingEvent.id}`, {
          title: editingEvent.title,
          date: editingEvent.date,
          time: editingEvent.time,
          description: editingEvent.description,
        });
        
        setEvents(events.map(e => 
          e.id === response.data.id ? response.data : e
        ));
        setEditingEvent(null);
      } catch (error) {
        console.error('Error updating event:', error);
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Delete this event?')) {
      try {
        await api.delete(`/calendar/${id}`);
        setEvents(events.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="h-14 md:h-24 border border-terminal-border bg-terminal-surface opacity-50" 
        />
      );
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = getEventsForDate(dateStr);
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={`h-14 md:h-24 border p-1 md:p-2 text-left transition-colors ${
            isSelected
              ? 'border-terminal-accent bg-terminal-accent bg-opacity-10'
              : isToday
              ? 'border-terminal-accent bg-terminal-surface'
              : 'border-terminal-border bg-terminal-surface hover:border-terminal-accent'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-mono text-xs md:text-sm ${isToday ? 'text-terminal-accent' : 'text-terminal-text'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-terminal-accent rounded-full" />
            )}
          </div>
          
          {/* Eventos - visíveis apenas no desktop */}
          <div className="hidden md:block mt-1 space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div key={event.id} className="text-[10px] font-mono text-terminal-accent truncate">
                • {event.time} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[10px] font-mono text-terminal-dim">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
          
          {/* Indicador de eventos no mobile */}
          {dayEvents.length > 0 && (
            <div className="md:hidden mt-1 flex gap-0.5">
              {dayEvents.slice(0, 3).map((_, i) => (
                <span key={i} className="w-1 h-1 bg-terminal-accent rounded-full" />
              ))}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-2 md:p-4 lg:p-8">
          {/* Header Responsivo */}
          <div className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-2">
            <h1 className="font-mono text-lg md:text-2xl text-terminal-accent">
              ❯ Calendar
            </h1>
            <div className="flex items-center gap-1 md:gap-4 flex-wrap">
              <button
                onClick={handlePrevMonth}
                className="px-2 md:px-3 py-1 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent transition-colors"
              >
                ←
              </button>
              <span className="font-mono text-sm md:text-lg text-terminal-text capitalize">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="px-2 md:px-3 py-1 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent transition-colors"
              >
                →
              </button>
              
              {/* View mode toggle */}
              <div className="flex gap-1 ml-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors ${
                    viewMode === 'month'
                      ? 'bg-terminal-accent text-terminal-bg border-terminal-accent'
                      : 'bg-terminal-bg text-terminal-text border-terminal-border'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors ${
                    viewMode === 'list'
                      ? 'bg-terminal-accent text-terminal-bg border-terminal-accent'
                      : 'bg-terminal-bg text-terminal-text border-terminal-border'
                  }`}
                >
                  List
                </button>
              </div>
              
              <button
                onClick={() => setShowAddEvent(true)}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [+ Event]
              </button>
            </div>
          </div>

          {/* Calendar Grid - Month View */}
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-px bg-terminal-border border border-terminal-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-terminal-surface p-1 md:p-2 text-center font-mono text-[8px] md:text-xs text-terminal-accent truncate">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="font-mono text-sm text-terminal-dim">-- no events --</div>
              ) : (
                [...events]
                  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                  .map(event => (
                    <div
                      key={event.id}
                      className="bg-terminal-surface border border-terminal-border p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-terminal-accent">❯</span>
                        <span className="font-mono text-xs md:text-sm text-terminal-accent">
                          {event.date}
                        </span>
                        <span className="font-mono text-xs md:text-sm text-terminal-text">
                          {event.time}
                        </span>
                        <span className="font-mono text-xs md:text-sm text-terminal-text font-bold">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setShowAddEvent(true);
                          }}
                          className="text-[10px] md:text-xs font-mono text-terminal-dim hover:text-terminal-accent"
                        >
                          [edit]
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-[10px] md:text-xs font-mono text-terminal-dim hover:text-red-500"
                        >
                          [delete]
                        </button>
                      </div>
                      {event.description && (
                        <div className="font-mono text-[10px] md:text-xs text-terminal-dim md:ml-6 w-full">
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Selected Date Events */}
          <div className="mt-4 md:mt-8">
            <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-2 md:mb-4">
              &lt;events_on {selectedDate}/&gt;
            </h2>
            <div className="space-y-2">
              {selectedDateEvents.length === 0 ? (
                <div className="font-mono text-xs md:text-sm text-terminal-dim">
                  -- no events --
                </div>
              ) : (
                selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-terminal-surface border border-terminal-border p-3 md:p-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-terminal-accent">❯</span>
                        <span className="font-mono text-xs md:text-sm text-terminal-text">{event.time}</span>
                        <span className="font-mono text-xs md:text-sm text-terminal-text">{event.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setShowAddEvent(true);
                          }}
                          className="text-[10px] md:text-xs font-mono text-terminal-dim hover:text-terminal-accent"
                        >
                          [edit]
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-[10px] md:text-xs font-mono text-terminal-dim hover:text-red-500"
                        >
                          [delete]
                        </button>
                      </div>
                    </div>
                    {event.description && (
                      <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1 md:mt-2 md:ml-6">
                        {event.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal - Responsivo */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-md">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
              {editingEvent ? '&lt;edit_event/&gt;' : '&lt;new_event/&gt;'}
            </h3>
            <div className="space-y-3 md:space-y-4">
              <TerminalInput
                label="title:"
                placeholder="Important meeting"
                value={editingEvent ? editingEvent.title : newEvent.title}
                onChange={(e) => editingEvent 
                  ? setEditingEvent({ ...editingEvent, title: e.target.value })
                  : setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
              <TerminalInput
                label="time:"
                type="time"
                value={editingEvent ? editingEvent.time : newEvent.time}
                onChange={(e) => editingEvent
                  ? setEditingEvent({ ...editingEvent, time: e.target.value })
                  : setNewEvent({ ...newEvent, time: e.target.value })
                }
              />
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim">
                  description:
                </label>
                <textarea
                  value={editingEvent ? editingEvent.description || '' : newEvent.description}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({ ...editingEvent, description: e.target.value })
                    : setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm p-2 focus:outline-none focus:border-terminal-accent"
                  rows={3}
                  placeholder="Event details..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm"
                >
                  [ Save ]
                </button>
                <button
                  onClick={() => {
                    setShowAddEvent(false);
                    setEditingEvent(null);
                  }}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
                >
                  [ Cancel ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}