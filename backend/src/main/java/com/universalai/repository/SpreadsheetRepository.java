package com.universalai.repository;

import com.universalai.entity.Spreadsheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpreadsheetRepository extends JpaRepository<Spreadsheet, UUID> {
    List<Spreadsheet> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}