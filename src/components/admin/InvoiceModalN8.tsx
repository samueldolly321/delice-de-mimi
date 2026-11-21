import React, { useRef, useState } from 'react';
import { deliveryFeeLabel, getDeliveryFeeStatus } from '../../utils/delivery';
import { X, Printer, CheckCircle, Store, Phone, MapPin, Download } from 'lucide-react';
import { Order, RestaurantSettings } from '../../types';
import { DeliveryFeePicker } from './DeliveryFeePicker';
import { printReceipt, getSavedPaperWidth, savePaperWidth, ReceiptPaperWidth } from '../../utils/printReceipt';

interface InvoiceModalN8Props {
  order: Order;
  settings: RestaurantSettings;
  isOpen: boolean;
  onClose: () => void;
  allOrders?: Order[];
  onSelectOrder?: (order: Order) => void;
  /** Appelé quand l'admin choisit les frais de livraison depuis la facture. */
  onOrderUpdated?: (order: Order) => void;
}

export const InvoiceModalN8: React.FC<InvoiceModalN8Props> = ({
  order,
  settings,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>(getSavedPaperWidth);

  if (!isOpen) return null;

  const handlePrint = () => {
    printReceipt('facture-n8-container', paperWidth);
  };

  const choosePaperWidth = (width: ReceiptPaperWidth) => {
    setPaperWidth(width);
    savePaperWidth(width);
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const invoiceNumber = `FAC-${order.id.replace('CMD-', '')}`;

  const formatAr = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
  };

  const isTakeaway = order.deliveryType === 'takeaway' || (order.deliveryType as string) === 'pickup';
  const modeLabel = isTakeaway ? 'À récupérer' : 'Livraison';
  const feeStatus = getDeliveryFeeStatus(order, settings);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">

      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-300 overflow-hidden animate-in zoom-in-95 duration-200 text-stone-900 flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (Non-printable) */}
        <div className="bg-stone-900 text-white p-4 px-5 flex items-center justify-between no-print border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white leading-tight">
                Impression Facture
              </h3>
              <p className="text-[11px] text-stone-300">
                Ticket de caisse {paperWidth} mm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-stone-800 p-0.5 text-[11px] font-bold" role="group" aria-label="Largeur du rouleau">
              {([80, 58] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => choosePaperWidth(w)}
                  title={`Rouleau de ${w} mm`}
                  className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                    paperWidth === w ? 'bg-white text-stone-900' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {w} mm
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handlePrint}
              id="print-invoice-btn"
              disabled={feeStatus === 'pending'}
              title={feeStatus === 'pending' ? 'Choisissez d’abord les frais de livraison' : undefined}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="p-4 sm:p-6 pb-12 overflow-y-auto bg-stone-100 flex flex-col items-center flex-1 min-h-0">
          {/* Choix des frais de livraison (non imprimé) */}
          {!isTakeaway && (
            <div className="no-print w-full max-w-[340px] mb-4">
              {feeStatus === 'pending' && (
                <p className="text-[11px] font-bold text-amber-800 mb-1.5">
                  Choisissez les frais de livraison selon le lieu du client avant d’imprimer.
                </p>
              )}
              <DeliveryFeePicker order={order} settings={settings} onSaved={(o) => onOrderUpdated?.(o)} />
            </div>
          )}
          <div
            id="facture-n8-container"
            ref={printRef}
            className="w-full max-w-[340px] bg-white text-black p-5 sm:p-6 rounded-xl shadow-xl font-mono text-[11px] leading-tight border border-stone-300 shrink-0 mb-4"
          >
            {/* Restaurant Identification Header */}
            <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
              {/* Restaurant Logo */}
              {settings.logoUrl && (
                <div className="mb-2.5 flex justify-center">
                  <img
                    src={settings.logoUrl}
                    alt={settings.name || "Logo"}
                    className="w-16 h-16 object-contain grayscale contrast-125"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <h2 className="font-serif text-lg font-extrabold tracking-tight text-black uppercase">
                {settings.name || "Saveurs d'Asie"}
              </h2>

              <div className="text-[10px] text-black font-sans mt-1.5 space-y-0.5">
                <p>{settings.address}</p>
                <p>Tél : {settings.phone}</p>
                {settings.whatsappPhone && <p>WhatsApp : {settings.whatsappPhone}</p>}
              </div>

              {/* Fiscal Identification Numbers (Madagascar) */}
              <div className="mt-2 pt-1.5 border-t border-dotted border-black text-[9px] text-black font-sans space-y-0.5">
                <p>
                  NIF : <span className="font-mono font-bold">{settings.nifNumber || '3000845219'}</span> • STAT :{' '}
                  <span className="font-mono font-bold">{settings.statNumber || '56101 11 2021 0 10582'}</span>
                </p>
                <p>{settings.rcsNumber || 'RCS Antananarivo 2021 B 00458'}</p>
              </div>

              {/* Official Document Badge */}
              <div className="mt-2.5 inline-block border-2 border-black px-4 py-1 font-bold text-xs tracking-wider uppercase">
                FACTURE
              </div>
            </div>

            {/* Receipt Metadata (Order Details & Mode) */}
            <div className="py-2.5 border-b border-dashed border-black text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>N° Facture :</span>
                <span className="font-bold">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Heure :</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Mode :</span>
                <span className="uppercase underline underline-offset-2">
                  {modeLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Règlement :</span>
                <span className="capitalize">
                  {order.paymentMethod === 'mobile_money'
                    ? 'Mobile Money (MVola/Orange/Airtel)'
                    : order.paymentMethod === 'pay_on_site'
                    ? 'Paiement sur place'
                    : 'Espèces'}
                </span>
              </div>

              {/* Customer Information */}
              <div className="mt-2 pt-1.5 border-t border-dotted border-black">
                <div className="flex justify-between">
                  <span className="font-bold">Client :</span>
                  <span className="font-bold">{order.customer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact :</span>
                  <span>{order.customer.phone}</span>
                </div>
                {isTakeaway ? (
                  <div className="flex justify-between text-[9.5px]">
                    <span>Récupération :</span>
                    <span className="font-medium">Retrait au restaurant</span>
                  </div>
                ) : (
                  <div className="text-[9.5px] mt-0.5">
                    <span>Adresse : </span>
                    <span className="font-medium">
                      {order.customer.address} ({order.customer.district || 'Antananarivo'})
                    </span>
                  </div>
                )}
                {order.customer.instructions && (
                  <p className="italic mt-1 text-[9px]">
                    Note : "{order.customer.instructions}"
                  </p>
                )}
              </div>
            </div>

            {/* Items Table with prominent Dish Name under Désignation */}
            <div className="py-2.5 border-b-2 border-dashed border-black">
              {/* Table Column Headers */}
              <div className="flex items-center text-[10px] font-bold border-b border-black pb-1 mb-1.5 uppercase">
                <span className="w-[12%] text-left">Qté</span>
                <span className="w-[52%] text-left">Désignation (Plat)</span>
                <span className="w-[18%] text-right">P.U</span>
                <span className="w-[18%] text-right">Total</span>
              </div>

              {/* Items Rows */}
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div key={idx} className="text-[10px]">
                      <div className="flex items-start">
                        <span className="w-[12%] font-bold text-left">{item.quantity}x</span>
                        <span className="w-[52%] font-bold text-left leading-snug pr-1">
                          {item.name}
                        </span>
                        <span className="w-[18%] text-right font-normal">
                          {formatAr(item.price)}
                        </span>
                        <span className="w-[18%] text-right font-bold">
                          {formatAr(lineTotal)}
                        </span>
                      </div>

                      {/* Extra toppings if soup customizer was used */}
                      {item.toppings && item.toppings.length > 0 && (
                        <div className="pl-5 text-[9px] space-y-0.5 mt-0.5 text-black">
                          {item.toppings.map((topName, tIdx) => (
                            <div key={tIdx} className="italic">
                              + {topName}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Custom item instructions */}
                      {item.customNotes && (
                        <div className="pl-5 text-[8.5px] italic mt-0.5">
                          ↳ {item.customNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b-2 border-black space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>Montant de la nourriture :</span>
                <span>{formatAr(order.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>+ Frais de livraison :</span>
                <span>{deliveryFeeLabel(order, settings)}</span>
              </div>

              <div className="pt-2 border-t-2 border-black flex justify-between items-baseline text-sm font-black">
                <span className="uppercase tracking-wider">TOTAL NET À PAYER :</span>
                <span className="text-base font-bold">
                  {feeStatus === 'pending'
                    ? `${formatAr(order.subtotal)} + livraison`
                    : formatAr(order.total)}
                </span>
              </div>
            </div>

            {/* Regulatory Footer & Heartfelt Thank You Text */}
            <div className="pt-3 text-center space-y-1.5 font-sans">
              <div className="border border-black py-2 px-2.5 my-1 text-center">
                <p className="font-bold text-[10.5px] uppercase tracking-wide text-black">
                  ♥ MERCI POUR VOTRE CONFIANCE ! ♥
                </p>
                <p className="text-[9.5px] text-black mt-0.5 font-medium leading-tight">
                  {settings.invoiceNotice ||
                    'Toute notre équipe vous remercie chaleureusement de votre visite et vous souhaite un excellent appétit !'}
                </p>
                <p className="text-[9px] font-bold text-black mt-1 uppercase">
                  À très bientôt chez {settings.name || "Saveurs d'Asie"} !
                </p>
              </div>

              <p className="text-[8.5px] text-black pt-1">
                Facture délivrée conformément à la réglementation fiscale en vigueur à Madagascar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
