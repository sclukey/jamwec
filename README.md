# Jamwec

This is yet another web client for MPD. It is a JAvascript Mpd WEb
Client, more specifically. It is built mostly using JQuery with ajax,
with a bit of PHP for flavor (and also some basic functionality).

## Motivation

I have spent quite a while scouring the interwebs for a good web client
for MPD, but I have come up short. So, I made my own

The goals of this client are:

### 1. Organize music based on tags rather than folder structure.

Sometimes I know the artist, sometimes I know the album, sometimes I don't organize my directories, stuff happens. Regardless, I ought to be able to find what I'm looking for.

### 2. Place computational burden on client, not server.

My intention is to use this client on very basic hardware with limited
computational ability (Raspberry Pi, et al.). In most cases, even a
mobile device will be more powerful than the music server, so as much
of the load as possible should be transferred to the client side. This
basically implies lots of Javascript.

### 3. Look nice and simple.

I'm no graphic designer, but I still like things that look nice. I'm no
bloodhound, but I still like finding things. Rather than packing the
screen with every possible option and function, the main interface
should be as simple as possible with logical menus/links to more
advanced features.

### 4. Responsive design

This has also been kind of an experiment for me with responsive web
design. Ideally, this player will work equally well on any size screen.

## Prerequisites

To use Jamwec you will need a web server with PHP and cURL (for the
art), and an MPD server.

## Screenshot

![Jamwec Screenshot](https://raw.github.com/sclukey/jamwec/master/images/screenshot.png)
