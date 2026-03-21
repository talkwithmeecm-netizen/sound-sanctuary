// settings page for accessibility preferences
import React from 'react';
import { useAuth } from './AuthContext';
import { useUserSettings } from './useUserSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Label } from './label';
import { Slider } from './slider';
import { Switch } from './switch';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Settings as SettingsIcon, Type, Square, Maximize, Palette, Vibrate, Loader2 } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings } = useUserSettings(user?.id ?? null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* page header */}
      <h2 className="text-scaled-2xl font-bold flex items-center gap-3">
        <SettingsIcon className="w-7 h-7 icon-scaled" strokeWidth={2.5} />
        settings
      </h2>

      {/* text size slider */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-scaled-lg font-bold flex items-center gap-3">
            <Type className="w-6 h-6 icon-scaled" strokeWidth={2.5} />
            text size
          </CardTitle>
          <CardDescription className="text-scaled-base">
            adjust the size of all text in the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[settings.text_size]}
            onValueChange={([value]) => updateSettings({ text_size: value })}
            min={0.8}
            max={1.6}
            step={0.1}
            className="w-full"
            aria-label="text size slider"
          />
          <div className="flex justify-between text-scaled-sm text-muted-foreground">
            <span>smaller</span>
            <span className="font-bold">{Math.round(settings.text_size * 100)}%</span>
            <span>larger</span>
          </div>
        </CardContent>
      </Card>

      {/* button size slider */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-scaled-lg font-bold flex items-center gap-3">
            <Square className="w-6 h-6 icon-scaled" strokeWidth={2.5} />
            button size
          </CardTitle>
          <CardDescription className="text-scaled-base">
            adjust the size of buttons and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[settings.button_size]}
            onValueChange={([value]) => updateSettings({ button_size: value })}
            min={0.8}
            max={1.4}
            step={0.1}
            className="w-full"
            aria-label="button size slider"
          />
          <div className="flex justify-between text-scaled-sm text-muted-foreground">
            <span>smaller</span>
            <span className="font-bold">{Math.round(settings.button_size * 100)}%</span>
            <span>larger</span>
          </div>
        </CardContent>
      </Card>

      {/* icon size slider */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-scaled-lg font-bold flex items-center gap-3">
            <Maximize className="w-6 h-6 icon-scaled" strokeWidth={2.5} />
            icon size
          </CardTitle>
          <CardDescription className="text-scaled-base">
            adjust the size of all icons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[settings.icon_size]}
            onValueChange={([value]) => updateSettings({ icon_size: value })}
            min={0.8}
            max={1.6}
            step={0.1}
            className="w-full"
            aria-label="icon size slider"
          />
          <div className="flex justify-between text-scaled-sm text-muted-foreground">
            <span>smaller</span>
            <span className="font-bold">{Math.round(settings.icon_size * 100)}%</span>
            <span>larger</span>
          </div>
        </CardContent>
      </Card>

      {/* theme selector */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-scaled-lg font-bold flex items-center gap-3">
            <Palette className="w-6 h-6 icon-scaled" strokeWidth={2.5} />
            theme
          </CardTitle>
          <CardDescription className="text-scaled-base">
            choose a color theme for the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) => updateSettings({ theme: value as 'dark' | 'light' | 'light-contrast' })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="dark" id="dark" className="w-6 h-6" />
              <Label htmlFor="dark" className="text-scaled-base font-bold flex-1 cursor-pointer">
                dark (high contrast)
              </Label>
              <div className="w-8 h-8 rounded bg-[hsl(0,0%,5%)] border-2 border-border" />
            </div>
            <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="light" id="light" className="w-6 h-6" />
              <Label htmlFor="light" className="text-scaled-base font-bold flex-1 cursor-pointer">
                light
              </Label>
              <div className="w-8 h-8 rounded bg-[hsl(0,0%,100%)] border-2 border-[hsl(0,0%,70%)]" />
            </div>
            <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="light-contrast" id="light-contrast" className="w-6 h-6" />
              <Label htmlFor="light-contrast" className="text-scaled-base font-bold flex-1 cursor-pointer">
                light (high contrast)
              </Label>
              <div className="w-8 h-8 rounded bg-[hsl(0,0%,100%)] border-2 border-[hsl(0,0%,0%)]" />
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* haptic feedback toggle */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-scaled-lg font-bold flex items-center gap-3">
            <Vibrate className="w-6 h-6 icon-scaled" strokeWidth={2.5} />
            haptic notifications
          </CardTitle>
          <CardDescription className="text-scaled-base">
            vibrate device when sounds are detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border-2">
            <Label htmlFor="haptic" className="text-scaled-base font-bold cursor-pointer">
              enable vibration alerts
            </Label>
            <Switch
              id="haptic"
              checked={settings.haptic_enabled}
              onCheckedChange={(checked) => updateSettings({ haptic_enabled: checked })}
              className="scale-125"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
