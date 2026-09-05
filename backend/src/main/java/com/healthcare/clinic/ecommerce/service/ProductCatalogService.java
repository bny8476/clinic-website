package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductCatalogService {

    private final EcommerceProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<EcommerceProduct> getActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public Page<EcommerceProduct> searchProducts(String query, String category, Boolean rxRequired, String sortBy, int page, int size) {
        Sort sort = switch (sortBy != null ? sortBy : "") {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "title");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(Math.max(0, page), size > 0 ? size : 20, sort);
        String searchQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String categoryFilter = (category != null && !category.trim().isEmpty() && !"ALL".equalsIgnoreCase(category)) ? category.trim() : null;

        return productRepository.searchMedicines(searchQuery, categoryFilter, rxRequired, pageable);
    }

    @Transactional(readOnly = true)
    public EcommerceProduct getProductDetails(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + id));
    }

    @Transactional
    public EcommerceProduct createOrUpdateProduct(EcommerceProduct product) {
        if (product.getId() == null) {
            product.setCreatedAt(ZonedDateTime.now());
            if (product.getIsActive() == null) {
                product.setIsActive(true);
            }
        }
        return productRepository.save(product);
    }

    @Transactional
    public void archiveProduct(Long id) {
        EcommerceProduct product = productRepository.findById(id).orElseThrow();
        product.setProductStatus("ARCHIVED");
        product.setIsActive(false);
        productRepository.save(product);
    }
}
