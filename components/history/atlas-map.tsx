"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import type { GeoLocation } from "@/lib/history/types"
import { useEffect } from "react"

function FlyTo({ location }: { location?: GeoLocation }) { const map = useMap(); useEffect(() => { if (location) map.flyTo([location.lat, location.lon], 5, { duration: 1.1 }) }, [location, map]); return null }

export function AtlasMap({ locations, selected, onSelect }: { locations: GeoLocation[]; selected?: GeoLocation; onSelect: (location: GeoLocation) => void }) {
  const center: [number, number] = selected ? [selected.lat, selected.lon] : locations[0] ? [locations[0].lat, locations[0].lon] : [20, 0]
  return <div className="relative h-[430px] overflow-hidden rounded-xl border border-border bg-muted"><MapContainer center={center} zoom={locations.length ? 4 : 2} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FlyTo location={selected}/>{locations.map((location) => <Marker key={`${location.name}-${location.lat}`} position={[location.lat, location.lon]} eventHandlers={{ click: () => onSelect(location) }}><Popup><strong>{location.name}</strong><br/>{location.significance}</Popup></Marker>)}</MapContainer><div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-lg border border-border bg-background/90 px-3 py-2 shadow-sm"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Atlas layer</p><p className="mt-1 text-xs text-muted-foreground">OpenStreetMap · live places</p></div></div>
}
