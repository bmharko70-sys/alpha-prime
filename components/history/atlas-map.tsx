"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import type { GeoLocation } from "@/lib/history/types"
import { useEffect } from "react"

function FlyTo({ location }: { location?: GeoLocation }) { const map = useMap(); useEffect(() => { if (location) map.flyTo([location.lat, location.lon], 5, { duration: 1.1 }) }, [location, map]); return null }

function ZoomControls() {
  const map = useMap()
  return <div className="absolute right-4 top-4 z-[1000] flex flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_4px_rgba(60,64,67,.35)]"><button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()} className="h-9 w-9 text-xl leading-none text-[#3c4043] transition-colors hover:bg-[#f1f3f4]">+</button><button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()} className="h-9 w-9 border-t border-[#dadce0] text-xl leading-none text-[#3c4043] transition-colors hover:bg-[#f1f3f4]">−</button></div>
}

export function AtlasMap({ locations, selected, onSelect }: { locations: GeoLocation[]; selected?: GeoLocation; onSelect: (location: GeoLocation) => void }) {
  const center: [number, number] = selected ? [selected.lat, selected.lon] : locations[0] ? [locations[0].lat, locations[0].lon] : [20, 0]
  return <div className="relative h-[430px] overflow-hidden rounded-[18px] border border-[#dadce0] bg-[#e8eaed] shadow-sm"><MapContainer center={center} zoom={locations.length ? 4 : 2} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FlyTo location={selected}/><ZoomControls />{locations.map((location) => <Marker key={`${location.name}-${location.lat}`} position={[location.lat, location.lon]} eventHandlers={{ click: () => onSelect(location) }}><Popup><strong>{location.name}</strong><br/>{location.significance}</Popup></Marker>)}</MapContainer><div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#3c4043] shadow-[0_1px_4px_rgba(60,64,67,.3)]"><span className="h-2.5 w-2.5 rounded-full bg-[#1a73e8]"/><span>{selected?.name ?? "Explore the atlas"}</span></div><div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded bg-white/90 px-2 py-1 text-[10px] text-[#5f6368] shadow-sm">Live places · OpenStreetMap</div></div>
}
