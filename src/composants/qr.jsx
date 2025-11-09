import React, { useState, useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

export default function Codeqr() {
  const [lien, setLien] = useState("");
  const [nom, setNom] = useState("");
  const [condition, setCondition] = useState(false);
  const qrRef = useRef(null);
  const qrCode = useRef(null);

  const getInitials = () => nom.trim().slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!condition || !qrRef.current) return;

    // Mise à jour ou création du QR code
    if (qrCode.current) {
      try {
        qrCode.current.update({ data: lien });
        return;
      } catch {
        qrCode.current = null;
      }
    }

    qrRef.current.innerHTML = "";
    qrCode.current = new QRCodeStyling({
      width: 300,
      height: 300,
      type: "canvas",
      data: lien,
      dotsOptions: {
        gradient: {
          type: "linear",
          rotation: 0,
          colorStops: [
            { offset: 0, color: "#ff0000" },
            { offset: 1, color: "#0000ff" }
          ]
        }
      },
      backgroundOptions: {
        color: "#ffffff"
      }
    });
    qrCode.current.append(qrRef.current);
  }, [condition, lien]);

  useEffect(() => {
    return () => {
      if (qrRef.current) qrRef.current.innerHTML = "";
      qrCode.current = null;
    };
  }, []);

  const drawInitialsOnCanvas = async () => {
    if (!qrCode.current) throw new Error("QR non généré");

    const blob = await qrCode.current.getRawData("png");
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          ctx.font = "bold 50px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
          ctx.shadowBlur = 10;
          ctx.textBaseline = "middle";
          ctx.fillText(getInitials(), canvas.width / 2, canvas.height / 2);

          canvas.toBlob((finalBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (!finalBlob) return reject(new Error("Échec de la génération du blob final"));
            resolve(finalBlob);
          });
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Erreur lors du chargement de l'image QR"));
      };

      img.src = objectUrl;
    });
  };

  const handleDownload = async () => {
    try {
      const finalBlob = await drawInitialsOnCanvas();
      const url = URL.createObjectURL(finalBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error(e);
      alert("Erreur lors du téléchargement : " + (e.message || e));
    }
  };

  const handleShare = async () => {
    try {
      const finalBlob = await drawInitialsOnCanvas();
      const file = new File([finalBlob], "qr-code.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mon QR Code",
          text: "Voici mon QR à partager"
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Mon QR Code",
          text: "Voici mon QR à partager",
          url: window.location.href
        });
      } else {
        alert("Le partage d'image n'est pas supporté sur cet appareil.");
      }
    } catch (err) {
      console.error(err);
      alert("Échec du partage : " + (err.message || err));
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!lien.trim()) {
      alert("Veuillez entrer un lien valide.");
      return;
    }

    if (qrCode.current) {
      try {
        qrCode.current.update({ data: lien });
      } catch {
        setCondition(false);
        setTimeout(() => setCondition(true), 0);
      }
    } else {
      setCondition(true);
    }
  };

  return (
    <div className="form-wrapper">
      <form onSubmit={handleGenerate}>
        <input
          aria-label="Nom"
          value={nom}
          type="text"
          required
          placeholder="Entrez votre nom..."
          onChange={(e) => setNom(e.target.value)}
        />
        <input
          aria-label="Lien"
          value={lien}
          type="text"
          required
          placeholder="Entrez votre lien ici..."
          onChange={(e) => setLien(e.target.value)}
        />
        <button type="submit">Générer votre code QR</button>

        {condition && (
          <>
            <div className="qr-container">
              <div className="qr-wrapper">
                <div ref={qrRef} />
                <div className="qr-center-text">{getInitials()}</div>
              </div>
            </div>

            <div className="qr-actions">
              <button type="button" onClick={handleShare}>
                Partager mon code
              </button>
              <button type="button" onClick={handleDownload}>
                Télécharger mon code
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
