import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF de la rutina del cliente con marca de agua del gimnasio.
 * @param {Object} rutina - Objeto de la rutina con nombre, plan (ejercicios), entrenador_nombre
 * @param {string} clienteNombre - Nombre del cliente
 */
export const generateRoutinePDF = (rutina, clienteNombre = 'Cliente') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // ── Función para dibujar marca de agua ──
    const drawWatermark = () => {
        doc.setFontSize(60);
        doc.setTextColor(240, 240, 240);
        doc.text('GYMTRACK', centerX, centerY, {
            align: 'center',
            angle: 45
        });
    };

    drawWatermark();

    // ── Header ──
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('GYMTRACK', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Gimnasios', 14, 27);

    doc.setDrawColor(249, 115, 22);
    doc.setLineWidth(0.5);
    doc.line(14, 31, pageWidth - 14, 31);

    // ── Info de la rutina ──
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(rutina.nombre || 'Plan de Entrenamiento', 14, 42);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${clienteNombre}`, 14, 50);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CL')}`, 14, 56);

    if (rutina.entrenador_nombre) {
        doc.text(`Entrenador: ${rutina.entrenador_nombre}`, 14, 62);
    }

    // ── Tabla de ejercicios por día ──
    const ejercicios = rutina.plan || rutina.detalles || rutina.ejercicios || [];
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    let startY = rutina.entrenador_nombre ? 70 : 64;

    if (ejercicios.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('No hay ejercicios registrados en esta rutina.', 14, startY + 10);
        doc.save(`Rutina_${clienteNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
    }

    dias.forEach(dia => {
        const ejerciciosDia = ejercicios.filter(ej => ej.dia === dia);
        if (ejerciciosDia.length === 0) return;

        if (startY > pageHeight - 40) {
            doc.addPage();
            startY = 20;
            drawWatermark();
        }

        // Día header
        doc.setFontSize(12);
        doc.setTextColor(249, 115, 22);
        doc.setFont('helvetica', 'bold');
        doc.text(dia.toUpperCase(), 14, startY);
        startY += 3;

        const tableBody = ejerciciosDia.map((ej, i) => [
            String(i + 1),
            ej.grupo_muscular || '-',
            ej.nombre_ejercicio || ej.ejercicio_nombre || ej.nombre || '-',
            String(ej.series || '-'),
            String(ej.repeticiones || ej.reps || '-'),
            ej.carga || ej.carga_proyectada || 'Libre'
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['#', 'Músculo', 'Ejercicio', 'Series', 'Reps', 'Carga']],
            body: tableBody,
            theme: 'striped',
            headStyles: {
                fillColor: [40, 40, 40],
                textColor: [249, 115, 22],
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [50, 50, 50]
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 15, halign: 'center' },
                5: { cellWidth: 20, halign: 'center' }
            },
            margin: { left: 14, right: 14 },
            didDrawPage: () => {
                doc.setFontSize(7);
                doc.setTextColor(180, 180, 180);
                doc.text(
                    'Generado por GymTrack — Documento para uso personal',
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        });

        startY = doc.lastAutoTable.finalY + 10;
    });

    // ── Descargar ──
    const fileName = `Rutina_${clienteNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
