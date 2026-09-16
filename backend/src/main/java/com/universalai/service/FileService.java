package com.universalai.service;

import com.universalai.entity.Attachment;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@Slf4j
public class FileService {

    /**
     * Processa um arquivo enviado e extrai seu conteúdo para envio à IA
     */
    public Attachment processFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String fileType = file.getContentType();
        long fileSize = file.getSize();

        String content = null;

        if (fileType != null) {
            log.debug("Processando arquivo: {} (tipo: {}, tamanho: {} bytes)",
                    fileName, fileType, fileSize);

            if (fileType.startsWith("text/") ||
                    fileType.equals("application/json") ||
                    fileType.equals("application/xml") ||
                    fileType.equals("application/javascript") ||
                    fileType.equals("application/x-yaml") ||
                    fileType.equals("application/x-httpd-php") ||
                    fileType.equals("application/sql") ||
                    fileType.equals("application/csv") ||
                    fileType.equals("application/msword") ||
                    fileType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {

                // Extrair texto de arquivos de texto
                content = new String(file.getBytes(), StandardCharsets.UTF_8);
                log.debug("Conteúdo extraído: {} caracteres", content.length());

            } else if (fileType.equals("application/pdf")) {
                // Para PDFs, tentar extrair texto básico
                content = extractTextFromPdf(file);
                log.debug("Conteúdo PDF extraído: {} caracteres",
                        content != null ? content.length() : 0);

            } else if (fileType.startsWith("image/")) {
                // Para imagens, converter para base64
                // (o modelo atual não suporta visão, mas guardamos)
                byte[] bytes = file.getBytes();
                content = "data:" + fileType + ";base64," + Base64.getEncoder().encodeToString(bytes);
                log.debug("Imagem convertida para base64: {} bytes", bytes.length);
            }
        }

        return Attachment.builder()
                .fileName(fileName)
                .fileType(fileType)
                .fileSize(fileSize)
                .content(content)
                .build();
    }

    /**
     * Extrai texto de PDF usando uma abordagem simples
     * Para PDFs complexos, recomendamos Apache PDFBox
     */
    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try {
            // Usar Apache PDFBox para extração real
            PDDocument document = PDDocument.load(file.getBytes());
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            document.close();

            if (text != null && !text.trim().isEmpty()) {
                return text.trim();
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair PDF com PDFBox: {}", e.getMessage());
        }

        return "[PDF enviado: " + file.getOriginalFilename() + " - conteúdo não pôde ser extraído]";
    }
}