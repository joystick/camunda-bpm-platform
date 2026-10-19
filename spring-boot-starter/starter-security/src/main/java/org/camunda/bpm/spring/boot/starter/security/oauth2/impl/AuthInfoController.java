/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.spring.boot.starter.security.oauth2.impl;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class AuthInfoController {

  @GetMapping("/api/oidc/auth-info")
  public Map<String, Object> getAuthInfo() {
    Map<String, Object> result = new HashMap<>();
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth instanceof OAuth2AuthenticationToken) {
      result.put("authType", "oauth2");
      Object principal = ((OAuth2AuthenticationToken) auth).getPrincipal();
      if (principal instanceof OidcUser) {
        result.put("email", ((OidcUser) principal).getEmail());
      }
    } else {
      result.put("authType", "form");
    }

    return result;
  }
}
