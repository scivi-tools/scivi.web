#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from threading import Thread, Lock
import pygame
from pyGPIO.gpio import gpio, port

class WordThread(Thread):
    def __init__(self, captions, paths, iterCnt):

        self.TEXT_COLOR = (230, 231, 225)
        self.BACKGROUND_COLOR = (39, 40, 34)
        self.paths = paths
        self.captions = captions
        self.iterCnt = iterCnt
        self.mutex = Lock()
        self.renderRunning = False
        self.locked = False
        self.curIndex = -1
        self.curIter = -1
        self.pressed = True

        #def but_pressed(self):
        #    self.pressed = True

        #oGPIO.add_event_detect(17, oGPIO.RISING, callback=but_pressed)

        Thread.__init__(self)


    def stop(self):
        if self.is_running():
            self.mutex.acquire()
            self.renderRunning = False
            self.mutex.release()
            self.join()

    def cur_caption(self):
        self.mutex.acquire()
        if self.curIndex >= 0:
            result = self.captions[self.curIndex]
        else:
            result = None
        self.mutex.release()
        return result

    def cur_path(self):
        self.mutex.acquire()
        if self.curIndex >= 0:
            result = self.paths[self.curIndex]
        else:
            result = None
        self.mutex.release()
        return result

    def cur_iteration(self):
        self.mutex.acquire()
        result = self.curIter
        self.mutex.release()
        return result

    def is_running(self):
        self.mutex.acquire()
        result = self.renderRunning
        self.mutex.release()
        return result

    def is_locked(self):
        self.mutex.acquire()
        result = self.locked
        self.mutex.release()
        return result

    def set_locked(self, l):
        self.mutex.acquire()
        self.locked = l
        self.mutex.release()

    def create_text(self, msg, font):
        textRect = font.render(msg.strip(), True, self.TEXT_COLOR)
        w = textRect.get_width()
        h = textRect.get_height()
        result = pygame.Surface((w + 10, h + 10))
        result.fill(self.BACKGROUND_COLOR)
        result.blit(textRect, pygame.Rect(5, 5, w, h))
        return result

    def run(self):

        pygame.init()
        screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
        clock = pygame.time.Clock()
        screenSize = screen.get_size()
        pygame.mouse.set_visible(False)
        font = pygame.font.Font("lib/eeg/PermianSansTypeface-Bold.otf", 150)
        text = None
        elapsed = 0
        # silence = 30000
        silence = 1000
        self.mutex.acquire()
        self.renderRunning = True
        self.curIter = 0
        self.mutex.release()
        gpio.init()
        gpio.setcfg(port.GPIO4, 1)
        gpio.setcfg(port.GPIO17, 0)
        gpio.output(port.GPIO4, 0)
        pressed = False
        btnEnabled = True
        while self.is_running():
            for event in pygame.event.get():
                if event.type == pygame.QUIT or (event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE):
                    self.mutex.acquire()
                    self.renderRunning = False
                    self.mutex.release()
            if (not pygame.mixer.music.get_busy()) and btnEnabled and (gpio.input(port.GPIO17) == 1):
                pressed = True
                btnEnabled = False
                gpio.output(port.GPIO4, 0)
            if gpio.input(port.GPIO17) == 0:
                btnEnabled = True
            if (not self.is_locked() and pressed):
                pressed = False
                self.mutex.acquire()
                self.curIndex += 1
                if self.curIndex == len(self.captions):
                    self.curIndex = 0
                    self.curIter += 1
                    if self.curIter == self.iterCnt:
                        self.renderRunning = False
                if self.renderRunning:
                    text = self.create_text(self.captions[self.curIndex], font)
                    pygame.mixer.music.load(self.paths[self.curIndex])
                    pygame.mixer.music.play()
                self.mutex.release()
                gpio.output(port.GPIO4, 1)

            screen.fill(self.BACKGROUND_COLOR)
            if text:
                txtSize = text.get_size()
                screen.blit(text, ((screenSize[0] - txtSize[0]) // 2, (screenSize[1] - txtSize[1]) // 2))
            pygame.display.flip()
        pygame.mouse.set_visible(True)
        pygame.quit()

if "wordThread" in GLOB:
    wordThread = GLOB["wordThread"]
else:
    captions = SETTINGS_VAL["Captions"]
    paths = SETTINGS_VAL["Paths"]
    if captions:
        wordThread = WordThread(list(map(lambda w: w.strip(), captions.split("\n"))), list(map(lambda w: w.strip(), paths.split("\n"))),
                                int(SETTINGS_VAL["Iterations Count"]))
        GLOB["wordThread"] = wordThread
        REGISTER_SUBTHREAD(wordThread, wordThread.stop)
        wordThread.start()

wordThread.set_locked(INPUT.get("Next", False))

OUTPUT["Caption"] = wordThread.cur_caption()
OUTPUT["Iteration"] = wordThread.cur_iteration()
