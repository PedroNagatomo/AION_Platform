import { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { TerminalInput } from "../components/ui/TerminalInput";
import api from "../utils/api";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/contacts");
      setContacts(response.data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (name.trim() && phone.trim()) {
      try {
        const response = await api.post("/contacts", {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        setContacts([...contacts, response.data]);
        setName("");
        setPhone("");
        setEmail("");
        setNotes("");
        setShowForm(false);
      } catch (error) {
        console.error("Error adding contact:", error);
      }
    }
  };

  const handleUpdateContact = async () => {
    if (editingContact) {
      try {
        const response = await api.put(`/contacts/${editingContact.id}`, {
          name: editingContact.name,
          phone: editingContact.phone,
          email: editingContact.email,
          notes: editingContact.notes,
        });

        setContacts(
          contacts.map((c) => (c.id === response.data.id ? response.data : c)),
        );
        setEditingContact(null);
        setShowForm(false);
      } catch (error) {
        console.error("Error updating contact:", error);
      }
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (window.confirm("Delete this contact?")) {
      try {
        await api.delete(`/contacts/${id}`);
        setContacts(contacts.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleWhatsAppRedirect = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email &&
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-3 md:p-6 lg:p-8">
          {/* Header Responsivo */}
          <div className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-2">
            <div>
              <h1 className="font-mono text-lg md:text-2xl text-terminal-accent">
                ❯ Contacts
              </h1>
              <p className="font-mono text-[10px] md:text-sm text-terminal-dim hidden md:block">
                &lt;manage_your_contacts/&gt;
              </p>
            </div>
            <button
              onClick={() => {
                setEditingContact(null);
                setShowForm(!showForm);
              }}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors md:hidden"
            >
              {showForm ? "[ ✕ Close ]" : "[ + New ]"}
            </button>
          </div>

          {/* Formulário - Escondido no mobile por padrão */}
          <div
            className={`bg-terminal-surface border border-terminal-border p-3 md:p-4 mb-4 md:mb-8 ${showForm || editingContact ? "block" : "hidden md:block"}`}
          >
            <div className="font-mono text-xs md:text-sm text-terminal-accent mb-3 md:mb-4">
              {editingContact
                ? "&lt;edit_contact/&gt;"
                : "&lt;new_contact/&gt;"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <TerminalInput
                label="name:"
                placeholder="John Doe"
                value={editingContact ? editingContact.name : name}
                onChange={(e) =>
                  editingContact
                    ? setEditingContact({
                        ...editingContact,
                        name: e.target.value,
                      })
                    : setName(e.target.value)
                }
              />
              <TerminalInput
                label="phone:"
                placeholder="+1 555 123-4567"
                value={editingContact ? editingContact.phone : phone}
                onChange={(e) =>
                  editingContact
                    ? setEditingContact({
                        ...editingContact,
                        phone: e.target.value,
                      })
                    : setPhone(e.target.value)
                }
              />
              <TerminalInput
                label="email:"
                placeholder="john@email.com"
                value={editingContact ? editingContact.email || "" : email}
                onChange={(e) =>
                  editingContact
                    ? setEditingContact({
                        ...editingContact,
                        email: e.target.value,
                      })
                    : setEmail(e.target.value)
                }
              />
              <TerminalInput
                label="notes:"
                placeholder="Notes..."
                value={editingContact ? editingContact.notes || "" : notes}
                onChange={(e) =>
                  editingContact
                    ? setEditingContact({
                        ...editingContact,
                        notes: e.target.value,
                      })
                    : setNotes(e.target.value)
                }
              />
            </div>
            <div className="mt-3 md:mt-4 flex gap-2 flex-wrap">
              {editingContact ? (
                <>
                  <button
                    onClick={handleUpdateContact}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm"
                  >
                    [ Save ]
                  </button>
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setShowForm(false);
                    }}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
                  >
                    [ Cancel ]
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddContact}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm"
                >
                  [ Add Contact ]
                </button>
              )}
            </div>
          </div>

          {/* Busca */}
          <div className="mb-3 md:mb-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone or email..."
              className="w-full bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-3 py-2 focus:outline-none focus:border-terminal-accent placeholder:text-terminal-dim"
            />
          </div>

          {/* Lista de contatos */}
          {isLoading ? (
            <div className="font-mono text-xs md:text-sm text-terminal-dim">
              &lt;loading.../&gt;
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="font-mono text-xs md:text-sm text-terminal-dim">
              -- no contacts --
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-terminal-surface border border-terminal-border p-2 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 hover:border-terminal-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs md:text-sm text-terminal-text truncate">
                      ❯ {contact.name}
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-0.5 md:mt-1 truncate">
                      {contact.phone}
                      {contact.email && (
                        <span className="hidden md:inline">
                          {" "}
                          | {contact.email}
                        </span>
                      )}
                      {contact.notes && (
                        <span className="hidden md:inline">
                          {" "}
                          | {contact.notes}
                        </span>
                      )}
                    </div>
                    {/* Email visível no mobile */}
                    {contact.email && (
                      <div className="font-mono text-[10px] text-terminal-dim md:hidden truncate">
                        {contact.email}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 md:gap-2 flex-wrap md:flex-nowrap">
                    <button
                      onClick={() => handleWhatsAppRedirect(contact.phone)}
                      className="flex-1 md:flex-none px-2 md:px-3 py-1.5 md:py-1 bg-terminal-bg border border-green-500 text-green-500 font-mono text-[10px] md:text-xs hover:bg-green-500 hover:text-terminal-bg transition-colors"
                    >
                      [ WhatsApp ]
                    </button>
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setShowForm(true);
                      }}
                      className="flex-1 md:flex-none px-2 md:px-3 py-1.5 md:py-1 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-[10px] md:text-xs hover:border-terminal-accent hover:text-terminal-accent transition-colors"
                    >
                      [ Edit ]
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="flex-1 md:flex-none px-2 md:px-3 py-1.5 md:py-1 bg-terminal-bg border border-red-500 text-red-500 font-mono text-[10px] md:text-xs hover:bg-red-500 hover:text-terminal-bg transition-colors"
                    >
                      [ Delete ]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
