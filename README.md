# SENTINEL OSINT (formerly Overpass Radar)

### [ENG]

**Sentinel OSINT** is a high-fidelity, professional-grade tactical intelligence dashboard and geographical asset tracker. Built with modern web technologies, it aggregates real-time open-source intelligence (OSINT) from multiple global entities and projects them onto an interactive map.

Whether tracking active military aircraft, mapping strategic underground cabling, or calculating Mach-speed projectile ETAs, Sentinel functions as a complete "War Room" interface.

---

## Features

### Radar Controls
*   **Military Bases:** Automatically queries and plots secretive or public military installations, airbases, and barracks using complex bounding-box detection algorithms.
*   **Aircraft Tracking:** Hooks into the OpenSky API to stream live global aircraft. Includes a "Military Only" filter to isolate tactical flights globally.
*   **Ports & Shipyards:** Maps strategic naval infrastructure, dry docks, and major ports for maritime intelligence.
*   **Tactical Ruler:** A built-in targeting system. Click two points on the map to calculate the exact distance (KM) and estimate the time of arrival (ETA) based on dynamic Mach speeds (Mach 1 to Mach 5).

### OSINT Intelligence
*   **NASA Thermal Anomalies (FIRMS):** Overlays live thermal heat signatures straight from NASA satellite data to detect active fires, explosions, or industrial thermal spikes.
*   **Live Weather Layers:** Integrates RainViewer WMS to project real-time precipitation and heavy storm clouds over operational areas.
*   **Spy Satellites:** Connects to Celestrak TLE streams to map the real-time orbital positions of actively tracked satellites above the selected country.
*   **Seismic Radar:** Integrates USGS API to plot recent significant seismic events and earthquake clusters.
*   **Local Intel (Wiki Geo-Leak):** Cross-references geographical coordinates with Wikipedia database leaks to extract highly specific local operational data (barracks history, local entities).
*   **Energy / Power Grid:** Maps Highly Valuable Targets (HVT) such as power plants, nuclear reactors, and major electrical substations.
*   **National Networks & Global Submarine Cables:** Discovers physical communication backbones. Maps inland fiber optics (Telecom Exchanges) and global underwater submarine landing stations.

---

## Tech Stack & Architecture

*   **Frontend:** React.js, Vite, Leaflet, React-Leaflet, Lucide-React.
*   **Backend:** Node.js, Express, Axios.

### Public APIs Utilized:
*   **Overpass API (OSM):** Extracts coordinates and dimensions for global military bases, infrastructure (HVTs), and communication networks.
*   **OpenSky Network API:** Tracks worldwide transponder streams for finding active flight paths and military aircraft classification.
*   **USGS GeoJSON API:** Provides real-time and historical global earthquake and seismic anomaly data.
*   **Celestrak TLE Data:** Fetches Two-Line Element sets for real-time tracking of active satellite constellations.
*   **NASA FIRMS & RainViewer WMS:** Map layering protocols for thermal hot-spots and real-time precipitation mapping.
*   **MediaWiki API (Wikipedia):** Cross-references geographical zones to pull classified/leaked unit histories and base information.

*   **Architecture & Stability:** The backend uses dynamic query rotating and auto-retry algorithms for standard OpenStreetMap queries to circumvent Rate Limits (HTTP 429) and Bad Gateway (HTTP 502/504) crashes, keeping the app production-ready. However, please note that performance lag or browser freezing may occur when querying extremely large country datasets, which is a known architectural limitation at this time.


<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/066dfcfb-308a-4d43-830a-383950c20fdc" />
<img width="709" height="943" alt="image" src="https://github.com/user-attachments/assets/11e1f445-2019-4ab1-84f4-d990edeb776d" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3d48b917-b67f-4eed-a660-e16569ac774d" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/09234ab0-604d-4354-811f-5c119a44c5e1" />
<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/7f759b3b-1234-4755-af77-828128f6727b" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d8be8d1d-aef6-4fd7-8fd7-07e3c5a4c0aa" />
<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/952f9149-d097-4351-a559-bbbd5f70b8d6" />
<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/0fa4135a-a61e-41ae-b41f-a4da967af3d2" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/fb050fe5-0459-4259-ad32-ac8f568a6e94" />
<img width="1912" height="1080" alt="image" src="https://github.com/user-attachments/assets/c66cfcf0-05f2-45a8-a576-0c31a92b6a7c" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/92cd966b-9374-4f29-9482-4d92c2c3fcca" />
<img width="1919" height="1080" alt="image" src="https://github.com/user-attachments/assets/b6dd32fb-fbe5-40b3-91ee-f5235afd032a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f98a711d-097a-447a-99be-afa0a93a9f93" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/752284e1-e519-4d62-976f-733f5f015d1a" />
<img width="1918" height="1080" alt="image" src="https://github.com/user-attachments/assets/6f53b63a-946f-4ab6-a15c-e78b989e776f" />



---

## Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hasanerman/sentinel-osint.git
   cd sentinel-osint
   ```
2. **Start the Express Backend:**
   ```bash
   cd backend
   npm install
   node server.js
   ```
3. **Start the Vite Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

*(Disclaimer: This project uses publicly available Open-Source Intelligence data strictly for educational mapping purposes. Do not use this tool for actual military operations.)*

---
---

### [TR]

# SENTINEL OSINT

**Sentinel OSINT** (eski adiyla Overpass Radar), yuksek dogruluklu profesyonel bir taktiksel istihbarat panosu ve cografi varlik takip sistemidir. Modern web teknolojileriyle insa edilen bu sistem, dunya capindaki cesitli kaynaklardan gercek zamanli acik kaynak istihbarat (OSINT) verilerini toplar ve interaktif bir haritaya yansitir. 

Aktif savas ucaklarini takip etmekten, stratejik yeralti internet altyapisini haritalamaya veya menzil/hiz hesapli hedefleme yapmaya kadar tam tesekkullu bir "Operasyon Odasi" (War Room) gibi calisir.

## Ozellikler

### Radar Kontrolleri 
*   **Askeri Usler:** Gelismis sinir tanima algoritmalari ile hedeflenen ulkedeki kamuya acik ya da gizli askeri tesisleri, hava uslerini ve kislalari haritaya dokerek analiz imkani sunar.
*   **Canli Ucus Takibi:** OpenSky API ile dunya capindaki ucaklari canli izler. Ozel "Military Only" filtresiyle sivil ucaklari haritadan silip yalnizca askeri ucaklari filtreleyebilirsiniz.
*   **Limanlar ve Tersaneler:** Deniz istihbarati icin stratejik donanma altyapilarini, tersaneleri ve ana limanlari tespit eder.
*   **Taktiksel Cetvel:** Dahili hedef kitleme sistemi. Haritada belirlenen iki nokta arasindaki mesafeyi (KM) ve secilen MACH (Ses hizi 1-5) degerine gore tahmini varis suresini (ETA) anlik olarak hesaplar. Şeffaf arayuz tasarimi harita okumasini engellemez.

### OSINT Istihbarati
*   **NASA Termal Anomalileri:** NASA uydularindan alinan canli verilerle yeryuzundeki aktif yangin, patlama veya siddetli endustriyel termal radyoaktivite artislarini gosterir.
*   **Canli Hava Durumu:** Operasyon bolgesindeki canli yagis/firtina bulutlarini haritaya yansitir.
*   **Casus Uydular:** Celestrak uzerinden aldigi yorunge (TLE) verilerini isleyerek secili ulkenin uzerinden gecen aktif uydu takimyildizlarini gosterir.
*   **Sismik Radar:** USGS API uzerinden yakin zamanli siddetli depremleri ve sismik patlamalari gosterir.
*   **Yerel Sizinti Istihbarati:** Yalnizca harita koordinatlarini kullanarak Wikipedia veritabanini tarar ve tiklanilan bolge/us hakkindaki sizdirilmis tarihceleri (Orn: us gecmisi) ceker.
*   **Stratejik Enerji Agi:** Nukleer santraller, enerji tesisleri ve devasa elektrik trafolari gibi "Yuksek Degerli Hedefleri (HVT)" haritalar.
*   **Ulusal ve Kuresel Fiber Aglari:** Guck ve kuresel iletisim omurgasini analiz eder. Ulkelerin icinden gecen kara fiber optik aglarini ve Kitalararasi Denizalti Veri Kablolarini stratejik olarak cizer.

## Teknik Mimari

### Kullanilan API Altyapilari:
*   **Overpass API (OSM):** Ulkemizin ve dunya capindaki uslerin, kislalarin ve devasa fiber aglarin acik kaynak konumlarini haritalamak icin.
*   **OpenSky Network API:** Dunyadaki butun transponder sinyallerini toplayip "Sadece Askeri Ucaklar" siniflandirmasi yapmak icin.
*   **USGS GeoJSON API:** Gercek zamanli kuresel deprem merkezlerini ve sismik patlamalari cizdirmek icin.
*   **Celestrak TLE Data:** Aktif uydu yorungelerini ve spy-satellite aglarini canli cizmek icin.
*   **NASA FIRMS & RainViewer WMS:** Uydudan tespit edilen isisal (termal) dev uyarilari ve agir firtina ruzgarlarini katmanlamak icin.
*   **MediaWiki API (Wikipedia):** Cografi kordinatlara gizlenmis askeri tarihce sizintilarini ve us gecmisini cekmek icin.

Frontend `React.js` ve `Vite` kullanilarak devasa verileri kasmadan cizecek sekilde (Leaflet) olusturulmustur. Backend `Node.js` otomasyonlari ile API hiz kisitlamalarini (Rate Limits / 429) ve zaman asimlarini (Timeout / 504) asmak uzere "Dinamik Yeniden Deneme (Auto-Retry)" algoritmalariyla donatilmis, uretime (Production) hazir olarak kodlanmistir. Ama cok buyuk verilerde kasmalar oluyor, sunucu kapasitelerinden oturu onlari genis capta duzeltebilecegimi suanda dusunmuyorum.

---
*Proje, kamuya acik Acik Kaynak Istihbarat (OSINT) verilerini egitim macli kullanmaktadir.*
