package com.universalai.repository;

import com.universalai.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, UUID> {
    List<Integration> findByUserIdOrderByProviderAsc(UUID userId);
    Optional<Integration> findByUserIdAndProvider(UUID userId, String provider);
}