import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { Match } from "../../types";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BracketMatchModalProps {
  modalVisible: boolean;
  setModalVisible: (v: boolean) => void;
  matches: Match[];
}

export default function BracketMatchModal({
  modalVisible,
  setModalVisible,
  matches,
}: BracketMatchModalProps) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { i18n } = useTranslation();

  const renderMatchRow = (match: Match) => {
    const isFinished = match.status.short === "FT";
    const homeGoals = match.goals.home ?? 0;
    const awayGoals = match.goals.away ?? 0;
    const homeWon = homeGoals > awayGoals;
    const awayWon = awayGoals > homeGoals;

    return (
      <Pressable
        key={match._id}
        style={styles.pairContainer}
        onPress={() => {
          setModalVisible(false);
          router.push(`/match/${match._id}`);
        }}
      >
        {/* 날짜 */}
        <Text style={styles.dateText}>
          {new Date(match.date).toLocaleDateString(i18n.language, {
            month: "numeric",
            day: "numeric",
            weekday: "short",
          })}
        </Text>

        {/* 매치 행 */}
        <View style={styles.matchRow}>
          {/* 홈팀 */}
          <View style={styles.teamContainer}>
            <Image
              source={match.homeTeam.logo}
              style={styles.logo}
              contentFit="contain"
            />
            <Text
              style={[
                styles.teamName,
                isFinished && homeWon && styles.winner,
                isFinished && awayWon && styles.loser,
              ]}
              numberOfLines={1}
            >
              {match.homeTeam.name}
            </Text>
          </View>

          {/* 스코어 */}
          <View style={styles.scoreContainer}>
            {isFinished ? (
              <>
                <Text style={styles.score}>
                  {homeGoals} - {awayGoals}
                </Text>
                <Text style={styles.statusText}>FT</Text>
              </>
            ) : (
              <Text style={styles.statusText}>
                {new Date(match.date).toLocaleTimeString(i18n.language, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>

          {/* 원정팀 */}
          <View
            style={[styles.teamContainer, { flexDirection: "row-reverse" }]}
          >
            <Image
              source={match.awayTeam.logo}
              style={styles.logo}
              contentFit="contain"
            />
            <Text
              style={[
                styles.teamName,
                { textAlign: "right" },
                isFinished && awayWon && styles.winner,
                isFinished && homeWon && styles.loser,
              ]}
              numberOfLines={1}
            >
              {match.awayTeam.name}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setModalVisible(false)}
      >
        <View style={[styles.modalCard, { backgroundColor: Colors.surface }]}>
          {/* 헤더 */}
          <Text style={[styles.headerTitle, { color: Colors.text }]}>누적</Text>

          {/* 경기 목록 */}
          <View style={styles.contentContainer}>
            {matches.map((match, index) => (
              <View key={match._id}>
                {renderMatchRow(match)}
                {index < matches.length - 1 && (
                  <View
                    style={[styles.divider, { backgroundColor: Colors.border }]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: Colors.primary }]}>
              닫기
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.03)",
    },
    modalCard: {
      width: SCREEN_WIDTH * 0.85,
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      alignSelf: "center",
      marginBottom: 16,
    },
    contentContainer: {
      width: "100%",
    },
    pairContainer: {
      paddingVertical: 10,
    },
    dateText: {
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    matchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    teamContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    logo: {
      width: 32,
      height: 32,
    },
    teamName: {
      fontSize: 14,
      color: Colors.text,
      flex: 1,
    },
    scoreContainer: {
      alignItems: "center",
      paddingHorizontal: 12,
    },
    score: {
      fontSize: 22,
      fontWeight: "bold",
      color: Colors.text,
    },
    statusText: {
      fontSize: 11,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    winner: {
      fontWeight: "700",
      color: Colors.text,
    },
    loser: {
      textDecorationLine: "line-through",
      opacity: 0.5,
    },
    divider: {
      height: 1,
      marginVertical: 8,
    },
    closeButton: {
      alignSelf: "flex-end",
      marginTop: 16,
      padding: 8,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
  });
