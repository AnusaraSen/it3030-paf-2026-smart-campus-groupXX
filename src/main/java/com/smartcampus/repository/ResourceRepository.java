// FILE: src/main/java/com/smartcampus/repository/ResourceRepository.java
package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import com.smartcampus.model.Resource.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Resource entities with support for filtered, paginated queries.
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    /**
     * Returns a page of non-deleted resources, optionally filtered by type,
     * minimum capacity, and location (case-insensitive partial match).
     *
     * @param type     resource type filter; null means no filter
     * @param capacity minimum capacity filter; null means no filter
     * @param location location keyword filter; null means no filter
     * @param pageable pagination and sort info
     * @return page of matching resources
     */
    @Query("SELECT r FROM Resource r WHERE r.isDeleted = false " +
           "AND (:type IS NULL OR r.type = :type) " +
           "AND (:capacity IS NULL OR r.capacity >= :capacity) " +
           "AND (:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    Page<Resource> findAllFiltered(
            @Param("type") ResourceType type,
            @Param("capacity") Integer capacity,
            @Param("location") String location,
            Pageable pageable
    );
}
