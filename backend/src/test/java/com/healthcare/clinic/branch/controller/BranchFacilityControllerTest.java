package com.healthcare.clinic.branch.controller;

import com.healthcare.clinic.branch.repository.BranchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class BranchFacilityControllerTest {

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private BranchFacilityController controller;

    @Test
    public void getFacilitySummary_ShouldReturnMetrics() {
        ResponseEntity<Map<String, Object>> res = controller.getFacilitySummary(null, "Main City Branch");
        assertNotNull(res);
        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> body = res.getBody();
        assertNotNull(body);
        assertEquals(98.9, body.get("facilityUptime"));
        assertNotNull(body.get("utilities"));
    }

    @Test
    public void getMaintenanceOrders_ShouldReturnWorkOrders() {
        ResponseEntity<List<Map<String, Object>>> res = controller.getMaintenanceOrders("ALL");
        assertNotNull(res);
        assertEquals(200, res.getStatusCode().value());
        List<Map<String, Object>> list = res.getBody();
        assertNotNull(list);
        assertFalse(list.isEmpty());
    }

    @Test
    public void createMaintenanceOrder_ShouldAppendNewOrder() {
        Map<String, Object> req = new HashMap<>();
        req.put("title", "UPS Battery Replacement (OT 1)");
        req.put("location", "Operation Theatre Suite 1");
        req.put("priority", "CRITICAL");
        req.put("description", "Backup battery bank degradation detected");

        ResponseEntity<Map<String, Object>> res = controller.createMaintenanceOrder(req);
        assertNotNull(res);
        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> created = res.getBody();
        assertNotNull(created);
        assertEquals("UPS Battery Replacement (OT 1)", created.get("title"));
        assertEquals("IN_PROGRESS", created.get("status"));
    }

    @Test
    public void updateOrderStatus_ShouldUpdateStatus() {
        Map<String, String> statusMap = new HashMap<>();
        statusMap.put("status", "RESOLVED");

        ResponseEntity<Map<String, Object>> res = controller.updateOrderStatus(1L, statusMap);
        assertNotNull(res);
        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> updated = res.getBody();
        assertNotNull(updated);
        assertEquals("RESOLVED", updated.get("status"));
    }

    @Test
    public void getEquipmentAndSafety_ShouldReturnLists() {
        ResponseEntity<List<Map<String, Object>>> eqRes = controller.getEquipmentList();
        assertNotNull(eqRes);
        assertFalse(eqRes.getBody().isEmpty());

        ResponseEntity<List<Map<String, Object>>> auditRes = controller.getSafetyAudits();
        assertNotNull(auditRes);
        assertFalse(auditRes.getBody().isEmpty());

        ResponseEntity<Map<String, Object>> renewRes = controller.renewSafetyAudit(201L);
        assertNotNull(renewRes);
        assertEquals(200, renewRes.getStatusCode().value());
    }
}
