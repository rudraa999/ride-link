package com.ridelink.service;

import com.ridelink.dto.RideMatchDto;
import com.ridelink.model.RideMatch;
import com.ridelink.model.User;
import com.ridelink.repository.RideMatchRepository;
import com.ridelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final RideMatchRepository matchRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<RideMatchDto> getMatchHistory(Long userId, String statusFilter) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<RideMatch> matches;
        if (statusFilter == null || statusFilter.trim().isEmpty() || statusFilter.equalsIgnoreCase("ALL")) {
            matches = matchRepository.findAllForUser(user);
        } else {
            try {
                RideMatch.MatchStatus status = RideMatch.MatchStatus.valueOf(statusFilter.toUpperCase().trim());
                matches = matchRepository.findForUserByStatus(user, status);
            } catch (IllegalArgumentException e) {
                matches = matchRepository.findAllForUser(user);
            }
        }

        return matches.stream()
                .map(m -> RideMatchDto.fromEntity(m, user))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<RideMatchDto> getActiveMatch(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<RideMatch> active = matchRepository.findForUserByStatus(user, RideMatch.MatchStatus.ACTIVE);
        if (active.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(RideMatchDto.fromEntity(active.get(0), user));
    }

    @Transactional(readOnly = true)
    public RideMatchDto getMatchById(Long userId, Long matchId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        RideMatch match = matchRepository.findByIdAndUser(matchId, user)
                .orElseThrow(() -> new RuntimeException("Match not found or access denied: " + matchId));

        return RideMatchDto.fromEntity(match, user);
    }

    @Transactional
    public RideMatchDto updateMatchStatus(Long userId, Long matchId, String newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        RideMatch match = matchRepository.findByIdAndUser(matchId, user)
                .orElseThrow(() -> new RuntimeException("Match not found or access denied: " + matchId));

        RideMatch.MatchStatus status = RideMatch.MatchStatus.valueOf(newStatus.toUpperCase().trim());
        match.setStatus(status);
        RideMatch saved = matchRepository.save(match);

        return RideMatchDto.fromEntity(saved, user);
    }
}
