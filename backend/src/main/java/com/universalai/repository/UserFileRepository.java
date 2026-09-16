package com.universalai.repository;

import com.universalai.entity.UserFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserFileRepository extends JpaRepository<UserFile, UUID> {
    List<UserFile> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<UserFile> findByUserIdAndFolderNameOrderByCreatedAtDesc(UUID userId, String folderName);
    List<UserFile> findByUserIdAndIsFavoriteTrueOrderByCreatedAtDesc(UUID userId);
}