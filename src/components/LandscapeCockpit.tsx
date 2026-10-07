import React, { useRef, useCallback } from 'react';
import { LeverState, RampConfig, IRSensors, EscapeSubstate } from '../types/sumo';
import { DohyoArena } from './DohyoArena';
import { RotateCcw, RotateCw, Pause, Zap, Compass, Eye, ShieldAlert } from 'lucide-react';

interface LandscapeCockpitProps {
  leverL: LeverState;
  leverC: LeverState;
  leverR: LeverState;
  onLeverChange: (lever: 'L' | 'C' | 'R', value: number, isTouched: boolean) => void;
  onQuickAction: (action: 'CRUISE_50' | 'FULL_100' | 'STOP') => void;
  onTurn90: (direction: 'LEFT' | 'RIGHT') => void;
  activeTurn90: 'LEFT' | 'RIGHT' | null;
  isOverrideActive: boolean;
  isEmergencyLine: boolean;
  config: RampConfig;
  // Dohyo visual integration beside controls
  robotX: number;
  robotY: number;
  heading: number;
  irSensors: IRSensors;
  escapeSubstate: EscapeSubstate;
  onResetPosition: () => void;
}

interface Notch {
  value: number;
  label: string;
  tag: string;
}

const NOTCHES: Notch[] = [
  { value: 100, label: '+100%', tag: 'Fuerza Total' },
  { value: 50, label: '+50%', tag: 'Paseo Suave' },
  { value: 0, label: '0%', tag: 'Punto Cero' },
  { value: -50, label: '-50%', tag: 'Atrás Suave' },
  { value: -100, label: '-100%', tag: 'Atrás Total' },
];

export const LandscapeCockpit: React.FC<LandscapeCockpitProps> = ({
  leverL,
  leverC,
  leverR,
  onLeverChange,
  onQuickAction,
  onTurn90,
  activeTurn90,
  isOverrideActive,
  isEmergencyLine,
  config,
  robotX,
  robotY,
  heading,
  irSensors,
  escapeSubstate,
  onResetPosition
}) => {
  return (
    <div className="bg-[#f8f5ee] rounded-3xl p-5 md:p-6 shadow-sm border border-[#d8cfbe] transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dcce] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004225] flex items-center justify-center text-[#E9E1D0] shadow-sm">
            <Compass className="w-5 h-5 text-[#E9E1D0]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-[#1B1C1E] tracking-tight">
                Controles de Mando
              </h2>

              {/* Mini Dohyo al lado de la palabra Controles de Mando */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ede6d8] border border-[#d8cfbe] shadow-xs cursor-pointer hover:bg-[#e4dcce] transition-colors"
                onClick={onResetPosition}
                title="Mini Visor Dohyo en tiempo real (clic para centrar robot)"
              >
                <DohyoArena
                  robotX={robotX}
                  robotY={robotY}
                  heading={heading}
                  irSensors={irSensors}
                  escapeSubstate={escapeSubstate}
                  activeTurn90={activeTurn90}
                  size={42}
                  compact={true}
                  onReset={onResetPosition}
                />
                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#004225] pr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#004225] animate-pulse" />
                  <span>{Math.round(heading)}°</span>
                </div>
              </div>

              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E9E1D0] text-[#004225] border border-[#d8cfbe]">
                Landscape
              </span>
            </div>
            <p className="text-xs text-[#8A7F6A] mt-0.5">
              Desliza las palancas; al soltarlas regresan automáticamente al centro.
            </p>
          </div>
        </div>

        {/* State Banner */}
        <div className="flex items-center gap-2">
          {isEmergencyLine ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B1C1E] text-[#E9E1D0] text-xs font-semibold shadow-sm animate-pulse border border-[#8A7F6A]">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>¡Línea blanca detectada! Maniobra de rescate...</span>
            </div>
          ) : isOverrideActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2F4F3E]/10 border border-[#2F4F3E]/30 text-[#2F4F3E] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#2F4F3E]" />
              <span>Giro activo &middot; Palancas laterales al mando</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#004225]/10 border border-[#004225]/30 text-[#004225] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#004225]" />
              <span>Línea recta lista &middot; Palanca central</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Levers (Full Width, comfortable tactile control) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
        {/* LEVER 1: LEFT WHEEL */}
        <CleanLever
          title="Rueda Izquierda"
          subtitle="Motor izquierdo"
          value={leverL.raw}
          snappedLabel={leverL.snappedLabel}
          isTouched={leverL.isTouched}
          disabled={isEmergencyLine}
          colorTheme="forest"
          onValueChange={(val, touched) => onLeverChange('L', val, touched)}
          snapTolerance={config.snapTolerance}
          notches={NOTCHES}
        />

        {/* LEVER 2: CENTER CRUISE */}
        <div className="relative">
          <CleanLever
            title="Avance Recto"
            subtitle="Ambas ruedas"
            value={isOverrideActive ? 0 : leverC.raw}
            snappedLabel={isOverrideActive ? undefined : leverC.snappedLabel}
            isTouched={leverC.isTouched}
            disabled={isOverrideActive || isEmergencyLine}
            colorTheme="sage"
            onValueChange={(val, touched) => onLeverChange('C', val, touched)}
            snapTolerance={config.snapTolerance}
            notches={NOTCHES}
          />

          {/* Gentle Override Overlay */}
          {isOverrideActive && !isEmergencyLine && (
            <div className="absolute inset-0 bg-[#f8f5ee]/85 rounded-2xl backdrop-blur-[2px] border border-[#8A7F6A]/40 flex flex-col items-center justify-center p-3 text-center z-20 pointer-events-none transition-all">
              <div className="w-8 h-8 rounded-full bg-[#2F4F3E]/15 text-[#2F4F3E] flex items-center justify-center mb-1 shadow-sm">
                <Pause className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#2F4F3E]">
                Pausa automática
              </p>
              <p className="text-[10px] text-[#8A7F6A] mt-0.5 max-w-[170px]">
                En pausa mientras giras con ruedas individuales.
              </p>
            </div>
          )}
        </div>

        {/* LEVER 3: RIGHT WHEEL */}
        <CleanLever
          title="Rueda Derecha"
          subtitle="Motor derecho"
          value={leverR.raw}
          snappedLabel={leverR.snappedLabel}
          isTouched={leverR.isTouched}
          disabled={isEmergencyLine}
          colorTheme="forest"
          onValueChange={(val, touched) => onLeverChange('R', val, touched)}
          snapTolerance={config.snapTolerance}
          notches={NOTCHES}
        />
      </div>

      {/* Shortcuts Bar with One-Shot 90° Turn Buttons */}
      <div className="mt-5 pt-4 border-t border-[#e5dcce] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#8A7F6A] font-medium">
          <span className="font-semibold text-[#1B1C1E]">Atajos rápidos:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* One-Shot 90° Turn Left */}
          <button
            onClick={() => onTurn90('LEFT')}
            disabled={isEmergencyLine || activeTurn90 !== null}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
              activeTurn90 === 'LEFT'
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-[#004225] hover:bg-[#00341c] text-[#E9E1D0]'
            }`}
            title="Giro de 90 grados exactos hacia la izquierda (un solo uso por toque)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${activeTurn90 === 'LEFT' ? 'animate-spin' : 'text-[#E9E1D0]'}`} />
            <span>{activeTurn90 === 'LEFT' ? 'Girando 90°...' : 'Giro 90° Izquierda'}</span>
          </button>

          {/* One-Shot 90° Turn Right */}
          <button
            onClick={() => onTurn90('RIGHT')}
            disabled={isEmergencyLine || activeTurn90 !== null}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
              activeTurn90 === 'RIGHT'
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-[#004225] hover:bg-[#00341c] text-[#E9E1D0]'
            }`}
            title="Giro de 90 grados exactos hacia la derecha (un solo uso por toque)"
          >
            <RotateCw className={`w-3.5 h-3.5 ${activeTurn90 === 'RIGHT' ? 'animate-spin' : 'text-[#E9E1D0]'}`} />
            <span>{activeTurn90 === 'RIGHT' ? 'Girando 90°...' : 'Giro 90° Derecha'}</span>
          </button>

          {/* Gentle 50% */}
          <button
            onClick={() => onQuickAction('CRUISE_50')}
            disabled={isEmergencyLine || activeTurn90 !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2F4F3E] hover:bg-[#253f32] text-[#E9E1D0] text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-40"
          >
            <span>Paseo Suave (50%)</span>
          </button>

          {/* Full Attack */}
          <button
            onClick={() => onQuickAction('FULL_100')}
            disabled={isEmergencyLine || activeTurn90 !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1B1C1E] hover:bg-[#2b2c30] text-[#E9E1D0] text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-40"
          >
            <Zap className="w-3.5 h-3.5 text-[#E9E1D0]" />
            <span>Fuerza Total (100%)</span>
          </button>

          {/* Stop */}
          <button
            onClick={() => onQuickAction('STOP')}
            className="px-3.5 py-1.5 rounded-full bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#1B1C1E] text-xs font-semibold border border-[#d8cfbe] transition-all active:scale-95"
          >
            Detener
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CLEAN LEVER WITH PALETTE
// ============================================================================
interface CleanLeverProps {
  title: string;
  subtitle: string;
  value: number;
  snappedLabel?: string;
  isTouched: boolean;
  disabled: boolean;
  colorTheme: 'forest' | 'sage';
  onValueChange: (val: number, isTouched: boolean) => void;
  snapTolerance: number;
  notches: Notch[];
}

const CleanLever: React.FC<CleanLeverProps> = ({
  title,
  subtitle,
  value,
  snappedLabel,
  isTouched,
  disabled,
  colorTheme,
  onValueChange,
  snapTolerance,
  notches
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const springAnimRef = useRef<number | null>(null);

  const springReturnToZero = useCallback(
    (currentVal: number) => {
      let v = currentVal;
      const step = () => {
        if (Math.abs(v) < 1) {
          onValueChange(0, false);
          return;
        }
        v = v * 0.75;
        onValueChange(Math.round(v), false);
        springAnimRef.current = requestAnimationFrame(step);
      };
      springAnimRef.current = requestAnimationFrame(step);
    },
    [onValueChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    if (springAnimRef.current) cancelAnimationFrame(springAnimRef.current);
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const pctFromTop = Math.max(0, Math.min(1, offsetY / rect.height));

    let rawVal = Math.round((0.5 - pctFromTop) * 200);

    let finalVal = rawVal;
    for (const notch of notches) {
      if (Math.abs(rawVal - notch.value) <= snapTolerance) {
        finalVal = notch.value;
        break;
      }
    }

    onValueChange(finalVal, true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    springReturnToZero(value);
  };

  const isForest = colorTheme === 'forest';
  const thumbBg = isForest ? 'bg-[#004225]' : 'bg-[#2F4F3E]';
  const fillBg = isForest ? 'bg-[#004225]/30' : 'bg-[#2F4F3E]/30';
  const textColor = isForest ? 'text-[#004225]' : 'text-[#2F4F3E]';

  const thumbPercent = 50 - value / 2;

  return (
    <div
      className={`bg-[#f0ebe0] rounded-2xl p-3.5 border border-[#d8cfbe] flex flex-col justify-between select-none transition-all ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1.5 mb-1">
        <div>
          <h3 className="text-xs font-bold text-[#1B1C1E]">{title}</h3>
          <p className="text-[10px] text-[#8A7F6A]">{subtitle}</p>
        </div>

        <div className="text-right">
          <span className={`text-sm font-extrabold ${textColor}`}>
            {value > 0 ? `+${value}%` : `${value}%`}
          </span>
        </div>
      </div>

      {/* Snap pill */}
      <div className="h-5 flex items-center justify-center mb-1">
        {snappedLabel ? (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#E9E1D0] text-[#004225] border border-[#8A7F6A]/40">
            {snappedLabel}
          </span>
        ) : (
          <span className="text-[9px] text-[#8A7F6A]">
            {value === 0 ? 'Punto central' : 'Modulando...'}
          </span>
        )}
      </div>

      {/* Lever Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-[195px] w-full bg-[#f8f5ee] rounded-2xl border border-[#d8cfbe] flex items-center justify-center cursor-ns-resize touch-none overflow-hidden shadow-inner"
      >
        {/* Track groove */}
        <div className="absolute top-3.5 bottom-3.5 w-2 bg-[#E9E1D0] rounded-full border border-[#d8cfbe]" />

        {/* Dynamic fill */}
        {value !== 0 && (
          <div
            className={`absolute w-2.5 rounded-full ${fillBg} transition-all duration-75`}
            style={{
              top: value > 0 ? `${thumbPercent}%` : '50%',
              height: `${Math.abs(value) / 2}%`,
              left: 'calc(50% - 5px)'
            }}
          />
        )}

        {/* Clean notch guides */}
        {notches.map((notch) => {
          const notchY = 50 - notch.value / 2;
          const isCurrent = Math.abs(value - notch.value) <= 1;
          return (
            <div
              key={notch.value}
              className="absolute left-2.5 right-2.5 flex items-center justify-between pointer-events-none"
              style={{ top: `${notchY}%`, transform: 'translateY(-50%)' }}
            >
              <div
                className={`w-2 h-[1.5px] rounded-full transition-colors ${
                  isCurrent ? 'bg-[#004225] w-3.5' : 'bg-[#8A7F6A]/40'
                }`}
              />
              <span
                className={`text-[8px] font-medium transition-colors ${
                  isCurrent ? 'text-[#004225] font-bold' : 'text-[#8A7F6A]'
                }`}
              >
                {notch.tag}
              </span>
              <div
                className={`w-2 h-[1.5px] rounded-full transition-colors ${
                  isCurrent ? 'bg-[#004225] w-3.5' : 'bg-[#8A7F6A]/40'
                }`}
              />
            </div>
          );
        })}

        {/* Thumb button */}
        <div
          className={`absolute w-13 h-7 rounded-xl ${thumbBg} flex items-center justify-center shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-transform cursor-grab active:cursor-grabbing ${
            isTouched ? 'scale-105' : ''
          }`}
          style={{
            left: '50%',
            top: `${thumbPercent}%`
          }}
        >
          <div className="w-4 h-1 bg-[#E9E1D0] rounded-full opacity-80" />
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center text-[9px] text-[#8A7F6A] pt-1.5">
        Cero al soltar
      </div>
    </div>
  );
};
