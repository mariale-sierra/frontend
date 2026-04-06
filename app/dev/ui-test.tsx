import { ScrollView, View } from "react-native";
import { Container } from '../../components/ui/container';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { theme } from '../../constants/theme'; 


export default function UITest() {
  return (
    <Container>
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        
        {/* TEXT */}
        <Text variant="title">Title</Text>
        <Text variant="subheader">Subheader</Text>
        <Text variant="header">Header</Text>
        <Text variant="body">Body text example</Text>
        <Text variant="bodySecondary">Secondary text</Text>
        <Text variant="caption">Caption</Text>

        {/* BUTTONS */}
        <Button>Primary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="danger">Danger Button</Button>

        {/* BADGES */}
        {/* <Badge label="Strength" activityType="strength" /> */}
        {/* <Badge label="Cardio" activityType="cardioIntense" variant="filled" /> */}

        {/* CARDS */}
        <Card>
          <Text>Basic Card</Text>
        </Card>

        <Card variant="info">
          <Text>Info Card</Text>
        </Card>

        <Card variant="activity" activityType="mindBody">
          <Text>Activity Card</Text>
        </Card>

        <Card variant="streak" activityType="cardioLow">
          <Text>Streak Card</Text>
        </Card>

        <Card variant="infoGradient">
          <Text>Info Gradient Card</Text>
        </Card>

      </ScrollView>
    </Container>
  );
}