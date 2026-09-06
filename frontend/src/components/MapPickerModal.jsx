import React, { useState } from 'react';
import { MapComponent, GREATER_NOIDA_PLACES } from './MapComponent';
import { X, Check, MapPin, Navigation } from 'lucide-react';

export const MapPickerModal = ({
  isOpen,
  onClose,
  target = 'pickup', // 'pickup' or 'dropoff'
  initialLocation = null,
  onConfirmLocation,
}) => {
  const [selectedCoords, setSelectedCoords] = useState(initialLocation || GREATER_NOIDA_PLACES[0]);

  if (!isOpen) return null;

  const handleMapClick = (coords) => {
    setSelectedCoords({
      name: coords.name || `Custom Pin (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      lat: coords.lat,
      lng: coords.lng,
    });
  };

  const handleSelectPlace = (place) => {
    setSelectedCoords({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      onConfirmLocation(selectedCoords, target);
    }
    onClose();
  };

  const isPickup = target === 'pickup';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/90 backdrop-blur-md p-2 sm:p-4">
      {/* Modal Header */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl text-white ${isPickup ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {isPickup ? <MapPin className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Select {isPickup ? 'Pickup Location' : 'Destination'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isPickup ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                Tap map to set pin
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Selected: <strong className="text-amber-400">{selectedCoords?.name || 'Tap on map'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Interactive Map Area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl min-h-[300px]">
        <MapComponent
          center={{ lat: selectedCoords?.lat || 28.4633, lng: selectedCoords?.lng || 77.5082 }}
          pickup={isPickup ? selectedCoords : null}
          dropoff={!isPickup ? selectedCoords : null}
          onMapClick={handleMapClick}
          onSelectPlace={handleSelectPlace}
        />
      </div>

      {/* Confirmation Bottom Bar */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl mt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 w-full sm:w-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate">
            Target: <strong>{selectedCoords?.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 ${
              isPickup
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirm {isPickup ? 'Pickup' : 'Destination'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
