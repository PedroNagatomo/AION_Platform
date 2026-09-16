package com.universalai.repository;

import com.universalai.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND n.deletedAt IS NULL ORDER BY n.isFolder DESC, n.updatedAt DESC")
    List<Note> findAllActiveByUserId(@Param("userId") UUID userId);

    @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND n.parentId = :parentId AND n.deletedAt IS NULL ORDER BY n.isFolder DESC, n.title ASC")
    List<Note> findByUserIdAndParentId(@Param("userId") UUID userId, @Param("parentId") UUID parentId);

    @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND n.deletedAt IS NULL AND LOWER(n.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY n.updatedAt DESC")
    List<Note> searchByUserId(@Param("userId") UUID userId, @Param("searchTerm") String searchTerm);
}