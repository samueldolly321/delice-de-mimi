import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  Users,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  Check,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { ContactMessage, MessageStatus, MessageRequestType, RestaurantSettings } from '../../types';
import { api } from '../../services/api';
import { SocialIcon } from '../SocialIcons';

interface MessagesManagerProps {
  messages: ContactMessage[];
  settings?: RestaurantSettings;
  onRefresh: () => void;
}

export const MessagesManager: React.FC<MessagesManagerProps> = ({
  messages,
  settings,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MessageStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | MessageRequestType>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q);

      // Status
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;

      // Type
      const matchType = typeFilter === 'all' || m.requestType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [messages, searchQuery, statusFilter, typeFilter]);

  // Counts
  const newCount = messages.filter((m) => m.status === 'new').length;
  const reservationCount = messages.filter((m) => m.requestType === 'reservation').length;
  const treatedCount = messages.filter((m) => m.status === 'treated').length;

  const handleUpdateStatus = async (id: string, newStatus: MessageStatus) => {
    setIsUpdating(true);
    try {
      await api.updateMessageStatus(id, newStatus);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
      onRefresh();
    } catch (err) {
      console.error('Erreur mise à jour statut message:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
    try {
      await api.deleteMessage(id);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      onRefresh();
    } catch (err) {
      console.error('Erreur suppression message:', err);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const getCleanPhoneForWhatsApp = (rawPhone?: string) => {
    if (!rawPhone) return '';
    return rawPhone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-stone-500 text-xs font-semibold">Total Demandes</div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            {messages.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Tous canaux confondus</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[#C62828] text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C62828] animate-pulse" />
            Nouveaux / Non Lus
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#C62828] mt-1">
            {newCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">À traiter en priorité</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-purple-700 text-xs font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            Réservations Table
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-purple-900 mt-1">
            {reservationCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Demandes de table</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Traités
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800 mt-1">
            {treatedCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Réponses apportées</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, email, sujet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#C62828]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1F1F1F] text-[#FFE082]'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tous ({messages.length})
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'new'
                  ? 'bg-[#C62828] text-white'
                  : 'bg-red-50 text-[#C62828] hover:bg-red-100'
              }`}
            >
              Nouveaux ({newCount})
            </button>
            <button
              onClick={() => setStatusFilter('treated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'treated'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Traités ({treatedCount})
            </button>
          </div>
        </div>

        {/* Sub-filters for request types */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <span className="text-stone-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type :
          </span>
          {[
            { key: 'all', label: 'Toutes les demandes' },
            { key: 'reservation', label: '🍽️ Réservations' },
            { key: 'order_special', label: '🎉 Événement / Traiteur' },
            { key: 'information', label: '❓ Information' },
            { key: 'other', label: '💬 Autre' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key as any)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === tab.key
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List (left) */}
        <div className={`${selectedMessage ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3`}>
          {filteredMessages.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="font-serif text-base font-bold text-stone-700">
                Aucun message trouvé
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Aucun résultat ne correspond aux filtres appliqués.'
                  : 'Les messages et réservations envoyés depuis le site apparaîtront ici.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;

              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'new') {
                      handleUpdateStatus(msg.id, 'read');
                    }
                  }}
                  className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer text-left space-y-3 relative ${
                    isSelected
                      ? 'border-[#C62828] ring-2 ring-[#C62828]/10 shadow-sm'
                      : msg.status === 'new'
                      ? 'border-red-200 bg-red-50/20 hover:border-red-300 shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  {/* Top line: Name, Type, Status, Date */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-stone-900">{msg.name}</h4>
                        <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {msg.id}
                        </span>

                        {/* Request Type Badge */}
                        {msg.requestType === 'reservation' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> Réservation
                          </span>
                        )}
                        {msg.requestType === 'order_special' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            🎉 Événement
                          </span>
                        )}
                        {msg.requestType === 'information' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Question
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-[#8E1B1B] mt-1">
                        {msg.subject}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {msg.status === 'new' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C62828] text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Nouveau
                        </span>
                      )}
                      {msg.status === 'read' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Lu
                        </span>
                      )}
                      {msg.status === 'treated' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" /> Traité
                        </span>
                      )}
                      <div className="text-[10px] text-stone-400 mt-1">
                        {formatTimestamp(msg.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Reservation or Event details snippet if applicable */}
                  {(msg.requestType === 'reservation' || msg.requestType === 'order_special') && msg.reservationDate && (
                    <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center gap-4 text-xs text-purple-900">
                      {msg.reservationDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold">{msg.reservationDate}</span>
                        </div>
                      )}
                      {msg.reservationTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold">{msg.reservationTime}</span>
                        </div>
                      )}
                      {msg.guestsCount && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold">{msg.guestsCount} couverts</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message body preview */}
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {msg.message}
                  </p>

                  {/* Contact details footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                    <div className="flex items-center gap-3">
                      {msg.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {msg.phone}
                        </span>
                      )}
                      {msg.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-400" />
                          {msg.email}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-[#C62828]">
                      Cliquer pour ouvrir →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Message Detail Drawer (right) */}
        {selectedMessage && (
          <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 sticky top-24 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {selectedMessage.id}
                  </span>
                  <span className="text-xs text-stone-400">
                    {formatTimestamp(selectedMessage.createdAt)}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mt-1">
                  {selectedMessage.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-xs font-bold"
                  title="Fermer le panneau"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Status changer & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">Statut :</span>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleUpdateStatus(selectedMessage.id, e.target.value as MessageStatus)}
                  className="text-xs font-bold py-1.5 px-3 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#C62828]"
                >
                  <option value="new">🔴 Nouveau / Non lu</option>
                  <option value="read">🟡 Lu</option>
                  <option value="treated">🟢 Traité / Confirmé</option>
                </select>
              </div>

              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            </div>

            {/* Reservation / Event Card if applicable */}
            {(selectedMessage.requestType === 'reservation' || selectedMessage.requestType === 'order_special') && selectedMessage.reservationDate && (
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <span>
                    {selectedMessage.requestType === 'order_special'
                      ? "Détails de l'événement"
                      : 'Détails de la réservation'}
                  </span>
                </div>
                <div className={`grid ${selectedMessage.guestsCount ? 'grid-cols-3' : 'grid-cols-2'} gap-2 pt-2 text-xs`}>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <div className="text-[10px] text-purple-600 uppercase font-semibold">Date</div>
                    <div className="font-bold text-purple-950 mt-0.5">
                      {selectedMessage.reservationDate || 'Non précisée'}
                    </div>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <div className="text-[10px] text-purple-600 uppercase font-semibold">Heure</div>
                    <div className="font-bold text-purple-950 mt-0.5">
                      {selectedMessage.reservationTime || 'Non précisée'}
                    </div>
                  </div>
                  {selectedMessage.guestsCount ? (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                      <div className="text-[10px] text-purple-600 uppercase font-semibold">Couverts</div>
                      <div className="font-bold text-purple-950 mt-0.5">
                        {`${selectedMessage.guestsCount} pers.`}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Sujet & Message Body */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Sujet de la demande
              </div>
              <div className="text-sm font-bold text-stone-900">
                {selectedMessage.subject}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Message du client
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>
            </div>

            {/* Contact Customer Directly */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Répondre au client
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMessage.phone ? (
                  <a
                    href={`https://wa.me/${getCleanPhoneForWhatsApp(selectedMessage.phone)}?text=${encodeURIComponent(
                      `Bonjour ${selectedMessage.name}, nous faisons suite à votre demande (${selectedMessage.subject}) chez le restaurant ${settings?.name || "Saveurs d'Asie"} : `
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <SocialIcon platform="whatsapp" size={16} />
                    <span>Répondre sur WhatsApp</span>
                  </a>
                ) : null}

                {selectedMessage.email ? (
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject} - ${settings?.name || "Saveurs d'Asie"}`
                    )}&body=${encodeURIComponent(
                      `Bonjour ${selectedMessage.name},\n\nMerci pour votre message.\n\nCordialement,\nL'équipe ${settings?.name || "Saveurs d'Asie"}\n${settings?.phone || ''}`
                    )}`}
                    className="p-3 rounded-xl bg-stone-800 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Répondre par Email</span>
                  </a>
                ) : null}
              </div>

              {selectedMessage.phone && (
                <div className="pt-2">
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C62828]" />
                    <span>Appeler le client directement au : {selectedMessage.phone}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Mark as treated toggle button */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              {selectedMessage.status !== 'treated' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'treated')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Marquer comme Traité / Confirmé</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repasser en cours de traitement</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
