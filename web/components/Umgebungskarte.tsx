"use client";

import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";

/**
 * Kleine Karte mit dem Objekt und seinen Vergleichsobjekten.
 *
 * Client Component, weil Leaflet den DOM direkt anspricht und auf dem Server
 * nicht läuft. Sie wird von der Detailseite über next/dynamic ohne
 * serverseitiges Rendern geladen, damit die Seite statisch bleibt und die
 * Kartenbibliothek erst im Browser dazukommt.
 *
 * Statt der Standardmarker von Leaflet werden CircleMarker verwendet. Sie
 * brauchen keine Bilddateien, deren Pfade beim Bündeln ohnehin brechen, und
 * lassen sich in den Farben des Projekts zeichnen.
 *
 * @param mitte Koordinate des Objekts, auf das die Karte zentriert wird
 * @param titel Titel des Objekts, für die Beschriftung
 * @param nachbarn Vergleichsobjekte mit Koordinate und Distanz
 */
export function Umgebungskarte({
  mitte,
  titel,
  nachbarn,
}: {
  mitte: { lat: number; lon: number };
  titel: string;
  nachbarn: {
    slug: string;
    titel: string;
    lat: number;
    lon: number;
    distanzKm: string;
  }[];
}) {
  return (
    <MapContainer
      center={[mitte.lat, mitte.lon]}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: 240, width: "100%" }}
      className="rounded-kante"
      // Ohne Tastaturbedienung wäre die Karte für Tastaturnutzer eine Sackgasse.
      // Die Inhalte stehen zusätzlich als Liste darunter, die Karte ist Beiwerk.
      keyboard
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />

      <CircleMarker
        center={[mitte.lat, mitte.lon]}
        radius={9}
        pathOptions={{
          color: "#146c6b",
          fillColor: "#146c6b",
          fillOpacity: 0.9,
        }}
      >
        <Tooltip permanent direction="top">
          Dieses Objekt
        </Tooltip>
        <Popup>{titel}</Popup>
      </CircleMarker>

      {nachbarn.map((n) => (
        <CircleMarker
          key={n.slug}
          center={[n.lat, n.lon]}
          radius={6}
          pathOptions={{
            color: "#5c636b",
            fillColor: "#ffffff",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <a href={`/objekt/${n.slug}`}>{n.titel}</a>
            <br />
            {n.distanzKm} km entfernt
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
