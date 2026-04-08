import { ScrollView, View } from "react-native";
import { Container } from '../../components/ui/container';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card'; 
import { Dropdown } from '../../components/ui/dropdown';
import { useState } from "react";
import { Row } from '../../components/layout/row';




export default function UITest() {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

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
        <Button variant="activity" activityType="strength">Strength Activity Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="danger">Danger Button</Button>

        {/* BADGES */}
        {/* <Badge label="Strength" activityType="strength" /> */}
        {/* <Badge label="Cardio" activityType="cardioIntense" variant="filled" /> */}

        {/* CARDS */}
        <Card>
          <Text>Basic Card</Text>
        </Card>

        <Card variant="activityOutlineGlow" activityType="mindBody">
          <Text>Activity Outline Glow Card</Text>
        </Card>

        <Card variant="activityOutline" activityType="cardioLow">
          <Text>Activity Outline Card</Text>
        </Card>

        <Dropdown
          options={[
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
          ]}
          selectedValues={selectedValues}
          onChange={setSelectedValues}
          placeholder="Select options"
          maxSelections={2}
        />

        <Row justify = "space-between">
            <Text>Row with gap</Text>
            <Text>Title</Text>
        </Row>

      </ScrollView>
    </Container>
  );
}