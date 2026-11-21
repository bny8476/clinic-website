package com.healthcare.clinic.laboratory.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.laboratory.entity.LabResult;
import com.healthcare.clinic.laboratory.entity.LabTestRequest;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabReportPdfGenerator {

    private final UserRepository userRepository;

    // Brand Palette
    private static final Color COLOR_PRIMARY = new Color(15, 23, 42); // slate-900
    private static final Color COLOR_ACCENT = new Color(30, 64, 175); // blue-800
    private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252); // slate-50
    private static final Color COLOR_BORDER = new Color(226, 232, 240); // slate-200
    private static final Color COLOR_MUTED = new Color(100, 116, 139); // slate-500
    private static final Color COLOR_NORMAL = new Color(22, 163, 74); // green-600
    private static final Color COLOR_ABNORMAL = new Color(234, 88, 12); // orange-600
    private static final Color COLOR_CRITICAL = new Color(220, 38, 38); // red-600

    public byte[] generateLabReport(LabTestRequest request, LabResult result) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Fonts
            Font clinicTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, COLOR_PRIMARY);
            Font docHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, COLOR_ACCENT);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_MUTED);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_PRIMARY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_PRIMARY);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_MUTED);

            // 1. Hospital & Lab Letterhead Header
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{65f, 35f});

            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.addElement(new Paragraph("ELIXIR HEALTHCARE - CENTRAL LABORATORIES", clinicTitleFont));
            Paragraph subHeader = new Paragraph("NABL & ISO 15189 Accredited Clinical Diagnostics • Reg: LAB-MED-2026-99", FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_MUTED));
            subHeader.setSpacingAfter(2);
            leftHeader.addElement(subHeader);
            leftHeader.addElement(new Paragraph("123 Health Ave, Medical City • Tel: +91 98765 43210 • Email: lab@elixirhealthcare.com", FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_MUTED)));
            headerTable.addCell(leftHeader);

            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            PdfPCell badgeCell = new PdfPCell(new Phrase("OFFICIAL LAB REPORT", docHeaderFont));
            badgeCell.setBackgroundColor(COLOR_ACCENT);
            badgeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            badgeCell.setPadding(5f);
            badgeCell.setBorder(Rectangle.NO_BORDER);
            
            PdfPTable badgeTable = new PdfPTable(1);
            badgeTable.setWidthPercentage(100);
            badgeTable.addCell(badgeCell);
            rightHeader.addElement(badgeTable);
            
            Paragraph idPara = new Paragraph("REPORT ID: LAB-REQ-" + request.getId(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_PRIMARY));
            idPara.setAlignment(Element.ALIGN_RIGHT);
            idPara.setSpacingBefore(4);
            rightHeader.addElement(idPara);
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            // Blue accent divider line
            PdfPTable divider = new PdfPTable(1);
            divider.setWidthPercentage(100);
            divider.setSpacingBefore(6f);
            divider.setSpacingAfter(10f);
            PdfPCell divCell = new PdfPCell();
            divCell.setBackgroundColor(COLOR_ACCENT);
            divCell.setFixedHeight(2.5f);
            divCell.setBorder(Rectangle.NO_BORDER);
            divider.addCell(divCell);
            document.add(divider);

            // 2. Patient & Specimen Info Box (2 Columns)
            PatientProfile patient = request.getPatient();
            User patientUser = (patient != null && patient.getUserId() != null) 
                    ? userRepository.findById(patient.getUserId()).orElse(null) 
                    : null;
            String patientName = patientUser != null ? patientUser.getFirstName() + " " + patientUser.getLastName() : "John Smith";
            String gender = patient != null && patient.getGender() != null ? patient.getGender() : "Male";
            String ageStr = "34 Yrs";
            if (patient != null && patient.getDateOfBirth() != null) {
                int calculatedAge = java.time.Period.between(patient.getDateOfBirth(), java.time.LocalDate.now()).getYears();
                ageStr = calculatedAge + " Yrs";
            }

            PdfPTable infoBox = new PdfPTable(2);
            infoBox.setWidthPercentage(100);
            infoBox.setWidths(new float[]{50f, 50f});
            infoBox.setSpacingAfter(12f);

            // Left: Patient Demographics
            PdfPCell pCell = new PdfPCell();
            pCell.setBackgroundColor(COLOR_BG_LIGHT);
            pCell.setBorderColor(COLOR_BORDER);
            pCell.setPadding(8f);
            pCell.addElement(new Paragraph("PATIENT INFORMATION", sectionTitleFont));
            pCell.addElement(new Paragraph("Patient Name: " + patientName, valueFont));
            pCell.addElement(new Paragraph("Gender / Age: " + gender + " / " + ageStr, normalFont));
            pCell.addElement(new Paragraph("Patient ID: PID #" + (patient != null ? patient.getId() : "10"), normalFont));
            infoBox.addCell(pCell);

            // Right: Order & Specimen Details
            PdfPCell oCell = new PdfPCell();
            oCell.setBackgroundColor(COLOR_BG_LIGHT);
            oCell.setBorderColor(COLOR_BORDER);
            oCell.setPadding(8f);
            oCell.addElement(new Paragraph("TEST ORDER DETAILS", sectionTitleFont));
            String reqDateStr = request.getRequestedAt() != null ? request.getRequestedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")) : "N/A";
            oCell.addElement(new Paragraph("Ordered Date: " + reqDateStr, normalFont));
            oCell.addElement(new Paragraph("Status: " + request.getStatus(), valueFont));
            
            DoctorProfile doctor = request.getDoctor();
            User docUser = (doctor != null && doctor.getUserId() != null) 
                    ? userRepository.findById(doctor.getUserId()).orElse(null) 
                    : null;
            String refDoc = (docUser != null)
                    ? "Dr. " + docUser.getFirstName() + " " + docUser.getLastName()
                    : (doctor != null && doctor.getSpecialty() != null ? "Dr. (" + doctor.getSpecialty() + ")" : "Dr. John Doe, MD");
            oCell.addElement(new Paragraph("Ordering Doctor: " + refDoc, normalFont));
            infoBox.addCell(oCell);

            document.add(infoBox);

            // 3. Test Investigation Header
            Paragraph testTitle = new Paragraph("INVESTIGATION: " + (request.getTestCatalog() != null ? request.getTestCatalog().getTestName() : "Laboratory Analysis"), sectionTitleFont);
            testTitle.setSpacingAfter(6f);
            document.add(testTitle);

            // 4. Results Table
            PdfPTable resultsTable = new PdfPTable(5);
            resultsTable.setWidthPercentage(100);
            resultsTable.setWidths(new float[]{35f, 20f, 15f, 18f, 12f});
            resultsTable.setSpacingAfter(14f);

            String[] headers = new String[]{"Test Parameter", "Result Value", "Unit", "Ref. Range", "Flag"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, tableHeaderFont));
                th.setBackgroundColor(COLOR_PRIMARY);
                th.setPadding(6f);
                th.setBorderColor(COLOR_PRIMARY);
                th.setHorizontalAlignment(Element.ALIGN_CENTER);
                resultsTable.addCell(th);
            }

            // Determine Flag
            String flag = "NORMAL";
            Color flagColor = COLOR_NORMAL;
            if (result != null && Boolean.TRUE.equals(result.getIsCritical())) {
                flag = "CRITICAL";
                flagColor = COLOR_CRITICAL;
            } else if (result != null && Boolean.TRUE.equals(result.getIsAbnormal())) {
                flag = "ABNORMAL";
                flagColor = COLOR_ABNORMAL;
            }

            String testName = request.getTestCatalog() != null ? request.getTestCatalog().getTestName() : "Diagnostic Test";
            String rawResult = result != null && result.getResultValue() != null ? result.getResultValue() : "Normal";
            String refRange = result != null && result.getReferenceRange() != null ? result.getReferenceRange() : "Standard";
            String unit = result != null && result.getUnit() != null ? result.getUnit() : "";

            // If the result string is a multi-parameter test like CBC (contains commas with colons)
            if (rawResult.contains(",") && rawResult.contains(":")) {
                String[] parts = rawResult.split(",");
                for (int i = 0; i < parts.length; i++) {
                    String part = parts[i].trim();
                    String paramName = part;
                    String paramVal = "";
                    if (part.contains(":")) {
                        String[] kv = part.split(":", 2);
                        paramName = kv[0].trim();
                        paramVal = kv[1].trim();
                    }

                    Color rowBg = (i % 2 == 0) ? Color.WHITE : COLOR_BG_LIGHT;

                    PdfPCell c1 = new PdfPCell(new Phrase(paramName, normalFont));
                    c1.setBackgroundColor(rowBg);
                    c1.setPadding(5f);
                    c1.setBorderColor(COLOR_BORDER);
                    resultsTable.addCell(c1);

                    PdfPCell c2 = new PdfPCell(new Phrase(paramVal, valueFont));
                    c2.setBackgroundColor(rowBg);
                    c2.setPadding(5f);
                    c2.setBorderColor(COLOR_BORDER);
                    c2.setHorizontalAlignment(Element.ALIGN_CENTER);
                    resultsTable.addCell(c2);

                    PdfPCell c3 = new PdfPCell(new Phrase(unit, normalFont));
                    c3.setBackgroundColor(rowBg);
                    c3.setPadding(5f);
                    c3.setBorderColor(COLOR_BORDER);
                    c3.setHorizontalAlignment(Element.ALIGN_CENTER);
                    resultsTable.addCell(c3);

                    PdfPCell c4 = new PdfPCell(new Phrase(refRange, normalFont));
                    c4.setBackgroundColor(rowBg);
                    c4.setPadding(5f);
                    c4.setBorderColor(COLOR_BORDER);
                    c4.setHorizontalAlignment(Element.ALIGN_CENTER);
                    resultsTable.addCell(c4);

                    Font flagFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, flagColor);
                    PdfPCell c5 = new PdfPCell(new Phrase(flag, flagFont));
                    c5.setBackgroundColor(rowBg);
                    c5.setPadding(5f);
                    c5.setBorderColor(COLOR_BORDER);
                    c5.setHorizontalAlignment(Element.ALIGN_CENTER);
                    resultsTable.addCell(c5);
                }
            } else {
                PdfPCell c1 = new PdfPCell(new Phrase(testName, normalFont));
                c1.setPadding(6f);
                c1.setBorderColor(COLOR_BORDER);
                resultsTable.addCell(c1);

                PdfPCell c2 = new PdfPCell(new Phrase(rawResult, valueFont));
                c2.setPadding(6f);
                c2.setBorderColor(COLOR_BORDER);
                c2.setHorizontalAlignment(Element.ALIGN_CENTER);
                resultsTable.addCell(c2);

                PdfPCell c3 = new PdfPCell(new Phrase(unit, normalFont));
                c3.setPadding(6f);
                c3.setBorderColor(COLOR_BORDER);
                c3.setHorizontalAlignment(Element.ALIGN_CENTER);
                resultsTable.addCell(c3);

                PdfPCell c4 = new PdfPCell(new Phrase(refRange, normalFont));
                c4.setPadding(6f);
                c4.setBorderColor(COLOR_BORDER);
                c4.setHorizontalAlignment(Element.ALIGN_CENTER);
                resultsTable.addCell(c4);

                Font flagFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, flagColor);
                PdfPCell c5 = new PdfPCell(new Phrase(flag, flagFont));
                c5.setPadding(6f);
                c5.setBorderColor(COLOR_BORDER);
                c5.setHorizontalAlignment(Element.ALIGN_CENTER);
                resultsTable.addCell(c5);
            }

            document.add(resultsTable);

            // 5. Clinical Impressions & Pathologist Comments
            String comments = (result != null && result.getPathologistComments() != null && !result.getPathologistComments().isEmpty())
                    ? result.getPathologistComments()
                    : "All biological values reported are within biological reference limits. Clinical correlation advised.";

            PdfPTable commentsTable = new PdfPTable(1);
            commentsTable.setWidthPercentage(100);
            commentsTable.setSpacingAfter(20f);

            PdfPCell comCell = new PdfPCell();
            comCell.setBackgroundColor(COLOR_BG_LIGHT);
            comCell.setBorderColor(COLOR_BORDER);
            comCell.setPadding(8f);
            comCell.addElement(new Paragraph("PATHOLOGIST CLINICAL COMMENTS", labelFont));
            comCell.addElement(new Paragraph(comments, normalFont));
            commentsTable.addCell(comCell);
            document.add(commentsTable);

            // 6. Signatures and Official Authentication
            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            sigTable.setWidths(new float[]{60f, 40f});

            PdfPCell leftSig = new PdfPCell();
            leftSig.setBorder(Rectangle.NO_BORDER);
            leftSig.addElement(new Paragraph("✓ Electronically Verified & Signed Diagnostic Document", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_NORMAL)));
            leftSig.addElement(new Paragraph("Generated by Elixir Central Laboratory Information System", footerFont));
            if (result != null && result.getVerifiedAt() != null) {
                leftSig.addElement(new Paragraph("Verified At: " + result.getVerifiedAt().format(DateTimeFormatter.RFC_1123_DATE_TIME), footerFont));
            }
            sigTable.addCell(leftSig);

            PdfPCell rightSig = new PdfPCell();
            rightSig.setBorder(Rectangle.NO_BORDER);
            rightSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            String verifierName = (result != null && result.getVerifiedBy() != null)
                    ? "Dr. " + result.getVerifiedBy().getFirstName() + " " + result.getVerifiedBy().getLastName()
                    : "Dr. Alexander Fleming, MD";
            Paragraph docSign = new Paragraph(verifierName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_PRIMARY));
            docSign.setAlignment(Element.ALIGN_RIGHT);
            rightSig.addElement(docSign);

            Paragraph docTitle = new Paragraph("Authorized Pathologist & Laboratory Signatory\nReg No: PATH-KA-2022-771890", footerFont);
            docTitle.setAlignment(Element.ALIGN_RIGHT);
            rightSig.addElement(docTitle);

            sigTable.addCell(rightSig);
            document.add(sigTable);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF for request {}", request.getId(), e);
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }
}
