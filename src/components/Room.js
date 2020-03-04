import React from 'react'
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import NotificationsIcon from '@material-ui/icons/Notifications';
import MenuList from './MenuList';
import AttendeeList from './AttendeeList';
import DraggableWhiteboard from './DraggableWhiteboard';
import DraggableVideo from './DraggableVideo';
import DraggableText from './DraggableText';
import DraggableImage from './DraggableImage';
import io from "socket.io-client";
import socket from "./SocketContext";

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
}));

export default function CreateRoom(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [components, setComponents] = React.useState([]);
  const [users, setUsers] = React.useState(props.location.state.data.user_name);
  const { name, roomID, roomName } = props.match.params;

  React.useEffect(() => {
    console.log("In useEffect");

    socket.on("join_result", (joinResultData) => {
      if (joinResultData === "invalid input") {
        console.log("INVALID joinResultData");
      } else {
        setUsers(joinResultData.user_name);
      }
    });

    socket.on("remove_user", (removeUserData) => {
      console.log("VALID remove_user:", removeUserData);
    });
  });

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleAddComponent = (type) => {
    let newComponents = [...components];
    let index = newComponents.length;
    let key = [type, index].join(',');
    newComponents.push(key);
    setComponents(newComponents);
  }

  const handleDeleteComponent = (key) => {
    let newComponents = [...components];
    let index = newComponents.indexOf(key);
    newComponents.splice(index, 1);
    setComponents(newComponents);
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="absolute" className={clsx(classes.appBar, open && classes.appBarShift)}>
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
            Room {roomName}
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        classes={{
          paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
        }}
        open={open}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <MenuList handleAddComponent={handleAddComponent} />
        <Divider />
        <AttendeeList attendees={users} />
      </Drawer>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="lg" className={classes.container}>
          <Grid>
            {components.map((key) => {
              switch (key.split(',')[0]) {
                case 'video':
                  return (<DraggableVideo key={key} k={key} handleDeleteComponent={handleDeleteComponent} />);
                case 'text':
                  return (<DraggableText key={key} k={key} handleDeleteComponent={handleDeleteComponent} />);
                case 'whiteboard':
                  return (<DraggableWhiteboard key={key} k={key} handleDeleteComponent={handleDeleteComponent} />);
                case 'image':
                  return (<DraggableImage key={key} k={key} handleDeleteComponent={handleDeleteComponent} />);
              }
            })}
          </Grid>
        </Container>
      </main>
    </div>
  );
}
